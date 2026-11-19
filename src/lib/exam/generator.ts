import type { AddSubSpec, DivSpec, FlashSpec, MulSpec, PaperSpec, SectionSpec } from "./papers";

/** Every question is multiple choice with this many options (one correct). */
export const OPTION_COUNT = 4;

type Base = { id: string; answer: number; options: number[] };
export type Question =
  | (Base & { kind: "addsub"; rows: number[] })
  | (Base & { kind: "mul"; a: number; b: number })
  | (Base & { kind: "div"; a: number; b: number })
  | (Base & { kind: "flash"; rows: number[]; intervalMs: number });

/** Omit that keeps the union's variants separate. */
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Draft = DistOmit<Question, "options">;

export type PaperSection = { id: string; title: string; kind: SectionSpec["kind"]; questions: Question[] };

export type Paper = {
  gradeId: string;
  durationSec: number;
  sections: PaperSection[];
};

type Strip<Q> = Q extends Question ? Omit<Q, "answer"> : never;
export type ClientQuestion = Strip<Question>;
export type ClientPaper = {
  gradeId: string;
  durationSec: number;
  sections: { id: string; title: string; kind: SectionSpec["kind"]; questions: ClientQuestion[] }[];
};

/** mulberry32 — small, fast, deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(arr: readonly T[]) => arr[int(0, arr.length - 1)];
  return { next, int, pick };
}
type Rng = ReturnType<typeof rng>;

function numWithDigits(r: Rng, digits: number, avoidTrailingZero = false) {
  if (digits === 1) return r.int(1, 9);
  for (;;) {
    const n = r.int(10 ** (digits - 1), 10 ** digits - 1);
    if (!avoidTrailingZero || n % 10 !== 0) return n;
  }
}

/** Can `d` be added/subtracted on a single rod showing `v` without 5- or 10-complements? */
function directOk(v: number, d: number, sign: 1 | -1) {
  const vh = v >= 5 ? 1 : 0;
  const vl = v % 5;
  const dh = d >= 5 ? 1 : 0;
  const dl = d % 5;
  return sign === 1 ? vh + dh <= 1 && vl + dl <= 4 : vh >= dh && vl >= dl;
}

function genAddSub(r: Rng, s: AddSubSpec, id: string): Draft {
  for (let attempt = 0; attempt < 500; attempt++) {
    const rows: number[] = [];
    let total = 0;
    let ok = true;
    for (let i = 0; i < s.rows; i++) {
      if (s.mode === "direct") {
        const opts: number[] = [];
        for (let d = 1; d <= 9; d++) {
          if (directOk(total, d, 1)) opts.push(d);
          if (i > 0 && s.subProb > 0 && directOk(total, d, -1)) opts.push(-d);
        }
        if (!opts.length) {
          ok = false;
          break;
        }
        const subs = opts.filter((x) => x < 0);
        const adds = opts.filter((x) => x > 0);
        const wantSub = subs.length > 0 && (adds.length === 0 || r.next() < s.subProb);
        const v = r.pick(wantSub ? subs : adds);
        rows.push(v);
        total += v;
      } else {
        const digits = r.int(s.digits[0], s.digits[1]);
        const n = numWithDigits(r, digits);
        const sub = i > 0 && r.next() < s.subProb && total - n >= 0;
        const v = sub ? -n : n;
        rows.push(v);
        total += v;
      }
    }
    if (!ok || total <= 0) continue;
    // avoid boring repeats like 3,3,3
    if (rows.every((x) => x === rows[0])) continue;
    return { id, kind: "addsub", rows, answer: total };
  }
  // Fallback that is always valid.
  const rows = Array.from({ length: s.rows }, () => 1);
  return { id, kind: "addsub", rows, answer: s.rows };
}

function genMul(r: Rng, s: MulSpec, id: string): Draft {
  const [da, db] = r.pick(s.shapes);
  const a = numWithDigits(r, da, true);
  const b = db === 1 ? r.int(2, 9) : numWithDigits(r, db, true);
  return { id, kind: "mul", a, b, answer: a * b };
}

function genDiv(r: Rng, s: DivSpec, id: string): Draft {
  for (let attempt = 0; attempt < 500; attempt++) {
    const [dd, dv] = r.pick(s.shapes);
    const b = dv === 1 ? r.int(2, 9) : numWithDigits(r, dv, true);
    const qmin = Math.max(2, Math.ceil(10 ** (dd - 1) / b));
    const qmax = Math.floor((10 ** dd - 1) / b);
    if (qmin > qmax) continue;
    const q = r.int(qmin, qmax);
    if (q % 10 === 0) continue;
    return { id, kind: "div", a: b * q, b, answer: q };
  }
  return { id, kind: "div", a: 84, b: 4, answer: 21 };
}

function genFlash(r: Rng, s: FlashSpec, id: string): Draft {
  const rows: number[] = [];
  for (let i = 0; i < s.rows; i++) {
    let n: number;
    do {
      n = numWithDigits(r, r.int(s.digits[0], s.digits[1]));
    } while (rows.length && rows[rows.length - 1] === n);
    rows.push(n);
  }
  return { id, kind: "flash", rows, intervalMs: s.intervalMs, answer: rows.reduce((a, b) => a + b, 0) };
}

/** Wrong answers a child could plausibly arrive at — so options can't be ruled out at a glance. */
function distractorPool(q: Draft): number[] {
  const a = q.answer;
  const pool = new Set<number>();
  const add = (n: number) => {
    // Every real answer is at least 1, so 0 would be an obviously wrong option.
    if (Number.isInteger(n) && n >= 1 && n !== a) pool.add(n);
  };
  if (a < 10) {
    for (let d = 1; d <= 4; d++) {
      add(a + d);
      add(a - d);
    }
    return [...pool];
  }
  const len = String(a).length;
  // A bead slipped on the tens / hundreds / thousands rod. Keeps the units digit, so checking it doesn't help.
  for (const step of [10, 20, 100, 200, 1000, 2000, 10000]) {
    if (step < 10 ** len) {
      add(a + step);
      add(a - step);
    }
  }
  if (q.kind === "addsub" || q.kind === "flash") {
    add(a - q.rows[q.rows.length - 1]); // forgot the last row
    if (q.kind === "addsub") for (const row of q.rows.slice(1)) add(a - 2 * row); // one sign read wrongly
  }
  if (q.kind === "mul") {
    add(a + q.a); // one multiplication-table step off
    add(a - q.a);
  }
  if (q.kind === "div") {
    add(a + 1);
    add(a - 1);
    add(a + 2);
    add(a - 2);
  }
  add(a + 1);
  add(a - 1);
  return [...pool];
}

/**
 * Picks 3 distractors and returns all options in ascending order. The number of options below the
 * answer is chosen uniformly (0–3), so the correct option's position gives nothing away either.
 */
function makeOptions(r: Rng, q: Draft): number[] {
  const a = q.answer;
  const len = String(a).length;
  const units = a % 10;
  const pool = distractorPool(q);
  // Prefer same digit count and same last digit; a little randomness keeps papers varied.
  const score = (n: number) => (String(n).length === len ? 2 : 0) + (n % 10 === units ? 1 : 0) + r.next() * 0.9;
  const ranked = (list: number[]) =>
    list
      .map((n) => ({ n, s: score(n) }))
      .sort((x, y) => y.s - x.s)
      .map((x) => x.n);
  const below = ranked(pool.filter((n) => n < a));
  const above = ranked(pool.filter((n) => n > a));
  const need = OPTION_COUNT - 1;
  const lo = Math.max(0, need - above.length);
  const hi = Math.min(need, below.length);
  const k = lo <= hi ? Math.min(hi, Math.max(lo, r.int(0, need))) : hi;
  const picks = [...below.slice(0, k), ...above.slice(0, need - k)];
  for (let step = 1; picks.length < need; step++) {
    if (!picks.includes(a + step)) picks.push(a + step);
  }
  return [...picks, a].sort((x, y) => x - y);
}

function signature(q: Draft) {
  return q.kind === "mul" || q.kind === "div" ? `${q.kind}:${q.a}:${q.b}` : `${q.kind}:${q.rows.join(",")}`;
}

/** Retries before allowing a repeat. Only the youngest classes (2–3 single-digit rows) have so few possible sums that repeats can happen. */
const UNIQUE_TRIES = 200;

export function generatePaper(gradeId: string, spec: PaperSpec, seed: number): Paper {
  const r = rng(seed);
  return {
    gradeId,
    durationSec: spec.durationSec,
    sections: spec.sections.map((s) => {
      const questions: Question[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < s.count; i++) {
        const id = `${s.id}${i + 1}`;
        const gen = () =>
          s.kind === "addsub" ? genAddSub(r, s, id) : s.kind === "mul" ? genMul(r, s, id) : s.kind === "div" ? genDiv(r, s, id) : genFlash(r, s, id);
        let draft = gen();
        for (let t = 0; t < UNIQUE_TRIES && seen.has(signature(draft)); t++) draft = gen();
        seen.add(signature(draft));
        questions.push({ ...draft, options: makeOptions(r, draft) } as Question);
      }
      return { id: s.id, title: s.title, kind: s.kind, questions };
    }),
  };
}

export function toClientPaper(p: Paper): ClientPaper {
  return {
    gradeId: p.gradeId,
    durationSec: p.durationSec,
    sections: p.sections.map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      questions: s.questions.map((q) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { answer, ...rest } = q;
        return rest as ClientQuestion;
      }),
    })),
  };
}

/** questionId -> chosen option, stored as a string. */
export type Answers = Record<string, string>;

export function normaliseAnswer(v: string | undefined) {
  if (v == null) return null;
  const t = v.replace(/[\s,]/g, "");
  if (!/^-?\d{1,12}$/.test(t)) return null;
  return Number(t);
}

export function scorePaper(p: Paper, answers: Answers) {
  let score = 0;
  let max = 0;
  const bySection: Record<string, { correct: number; total: number }> = {};
  for (const s of p.sections) {
    bySection[s.id] = { correct: 0, total: s.questions.length };
    for (const q of s.questions) {
      max++;
      if (normaliseAnswer(answers[q.id]) === q.answer) {
        score++;
        bySection[s.id].correct++;
      }
    }
  }
  return { score, max, bySection };
}

export function allQuestionIds(p: { sections: { questions: { id: string }[] }[] }) {
  return p.sections.flatMap((s) => s.questions.map((q) => q.id));
}
