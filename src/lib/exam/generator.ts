import type { AddSubSpec, DivSpec, FlashSpec, LevelSpec, MulSpec, SectionSpec } from "./levels";

export type Question =
  | { id: string; kind: "addsub"; rows: number[]; answer: number }
  | { id: string; kind: "mul"; a: number; b: number; answer: number }
  | { id: string; kind: "div"; a: number; b: number; answer: number }
  | { id: string; kind: "flash"; rows: number[]; intervalMs: number; answer: number };

export type PaperSection = { id: string; title: string; kind: SectionSpec["kind"]; questions: Question[] };

export type Paper = {
  levelId: string;
  durationSec: number;
  sections: PaperSection[];
};

type Strip<Q> = Q extends Question ? Omit<Q, "answer"> : never;
export type ClientQuestion = Strip<Question>;
export type ClientPaper = {
  levelId: string;
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

function genAddSub(r: Rng, s: AddSubSpec, id: string): Question {
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

function genMul(r: Rng, s: MulSpec, id: string): Question {
  const [da, db] = r.pick(s.shapes);
  const a = numWithDigits(r, da, true);
  const b = db === 1 ? r.int(2, 9) : numWithDigits(r, db, true);
  return { id, kind: "mul", a, b, answer: a * b };
}

function genDiv(r: Rng, s: DivSpec, id: string): Question {
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

function genFlash(r: Rng, s: FlashSpec, id: string): Question {
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

export function generatePaper(level: LevelSpec, seed: number): Paper {
  const r = rng(seed);
  return {
    levelId: level.id,
    durationSec: level.durationSec,
    sections: level.sections.map((s) => {
      const questions: Question[] = [];
      for (let i = 0; i < s.count; i++) {
        const id = `${s.id}${i + 1}`;
        if (s.kind === "addsub") questions.push(genAddSub(r, s, id));
        else if (s.kind === "mul") questions.push(genMul(r, s, id));
        else if (s.kind === "div") questions.push(genDiv(r, s, id));
        else questions.push(genFlash(r, s, id));
      }
      return { id: s.id, title: s.title, kind: s.kind, questions };
    }),
  };
}

export function toClientPaper(p: Paper): ClientPaper {
  return {
    levelId: p.levelId,
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
