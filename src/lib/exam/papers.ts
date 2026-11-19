/**
 * Class-wise papers. Parents pick their child's school class; each class has its own paper
 * and its own ranking. Edit counts, rows, digits or timings here.
 */

export type AddSubSpec = {
  id: string;
  title: string;
  kind: "addsub";
  count: number;
  /** Inclusive digit range per row, e.g. [1,1] or [3,4]. */
  digits: [number, number];
  rows: number;
  /** "direct" = single-rod moves only (no 5/10 complements). "free" = any, with carries. */
  mode: "direct" | "free";
  subProb: number;
};

export type MulSpec = {
  id: string;
  title: string;
  kind: "mul";
  count: number;
  /** [digits of a, digits of b] options */
  shapes: [number, number][];
};

export type DivSpec = {
  id: string;
  title: string;
  kind: "div";
  count: number;
  /** [digits of dividend, digits of divisor] options */
  shapes: [number, number][];
};

export type FlashSpec = {
  id: string;
  title: string;
  kind: "flash";
  count: number;
  digits: [number, number];
  rows: number;
  intervalMs: number;
};

export type SectionSpec = AddSubSpec | MulSpec | DivSpec | FlashSpec;

export type PaperSpec = {
  durationSec: number;
  sections: SectionSpec[];
};

export type Stage = "pre" | "primary" | "middle" | "senior";

export const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: "pre", label: "Pre-primary", short: "Nursery–UKG" },
  { id: "primary", label: "Primary", short: "Class 1–5" },
  { id: "middle", label: "Middle", short: "Class 6–8" },
  { id: "senior", label: "Senior", short: "Class 9–12" },
];

export type Grade = {
  /** Stored in the database — never change an id once registrations exist. */
  id: string;
  label: string;
  stage: Stage;
  /** Allowed age range on 1 Dec 2026 (typical age ± a year, so an older child can't take an easier paper). */
  ages: [number, number];
  /** One line for parents. */
  summary: string;
  paper: PaperSpec;
};

const add = (count: number, digits: [number, number], rows: number, mode: "direct" | "free", subProb: number): AddSubSpec => ({
  id: "A",
  title: subProb > 0 ? "Add & Subtract" : "Addition",
  kind: "addsub",
  count,
  digits,
  rows,
  mode,
  subProb,
});
const mul = (count: number, shapes: [number, number][]): MulSpec => ({ id: "M", title: "Multiplication", kind: "mul", count, shapes });
const div = (count: number, shapes: [number, number][]): DivSpec => ({ id: "D", title: "Division", kind: "div", count, shapes });
const flash = (count: number, digits: [number, number], rows: number, intervalMs: number): FlashSpec => ({
  id: "F",
  title: "Flash Round",
  kind: "flash",
  count,
  digits,
  rows,
  intervalMs,
});
const minutes = (m: number) => m * 60;

export const GRADES: Grade[] = [
  {
    id: "NUR",
    label: "Nursery",
    stage: "pre",
    ages: [4, 5],
    summary: "1-digit addition, 2 rows",
    paper: { durationSec: minutes(6), sections: [add(20, [1, 1], 2, "direct", 0), flash(5, [1, 1], 2, 2000)] },
  },
  {
    id: "LKG",
    label: "LKG",
    stage: "pre",
    ages: [4, 6],
    summary: "1-digit addition, 3 rows",
    paper: { durationSec: minutes(7), sections: [add(25, [1, 1], 3, "direct", 0), flash(5, [1, 1], 3, 1600)] },
  },
  {
    id: "UKG",
    label: "UKG",
    stage: "pre",
    ages: [4, 7],
    summary: "1-digit add & subtract, 3 rows",
    paper: { durationSec: minutes(8), sections: [add(30, [1, 1], 3, "direct", 0.35), flash(5, [1, 1], 3, 1400)] },
  },
  {
    id: "C1",
    label: "Class 1",
    stage: "primary",
    ages: [5, 8],
    summary: "1-digit add & subtract, 4 rows",
    paper: { durationSec: minutes(8), sections: [add(30, [1, 1], 4, "direct", 0.4), flash(5, [1, 1], 4, 1200)] },
  },
  {
    id: "C2",
    label: "Class 2",
    stage: "primary",
    ages: [6, 9],
    summary: "1-digit add & subtract, 5 rows, with small & big friends",
    paper: { durationSec: minutes(10), sections: [add(35, [1, 1], 5, "free", 0.4), flash(5, [1, 1], 5, 1000)] },
  },
  {
    id: "C3",
    label: "Class 3",
    stage: "primary",
    ages: [7, 10],
    summary: "2-digit sums (3 rows), 2×1 multiplication",
    paper: {
      durationSec: minutes(10),
      sections: [add(30, [2, 2], 3, "free", 0.4), mul(10, [[2, 1]]), flash(5, [1, 1], 5, 900)],
    },
  },
  {
    id: "C4",
    label: "Class 4",
    stage: "primary",
    ages: [8, 11],
    summary: "2-digit sums (4 rows), 2×1 & 3×1 multiplication",
    paper: {
      durationSec: minutes(10),
      sections: [add(30, [2, 2], 4, "free", 0.4), mul(10, [[2, 1], [3, 1]]), flash(5, [2, 2], 4, 1200)],
    },
  },
  {
    id: "C5",
    label: "Class 5",
    stage: "primary",
    ages: [9, 12],
    summary: "2-digit sums (5 rows), multiplication, division by 1 digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [2, 2], 5, "free", 0.4), mul(10, [[3, 1], [2, 2]]), div(10, [[2, 1], [3, 1]]), flash(5, [2, 2], 5, 1000)],
    },
  },
  {
    id: "C6",
    label: "Class 6",
    stage: "middle",
    ages: [10, 13],
    summary: "3-digit sums (4 rows), 3×1 & 2×2, 3-digit ÷ 1-digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [3, 3], 4, "free", 0.4), mul(10, [[3, 1], [2, 2]]), div(10, [[3, 1]]), flash(5, [2, 2], 5, 900)],
    },
  },
  {
    id: "C7",
    label: "Class 7",
    stage: "middle",
    ages: [11, 14],
    summary: "3-digit sums (5 rows), 2×2 & 3×2, division by 1 digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [3, 3], 5, "free", 0.4), mul(10, [[2, 2], [3, 2]]), div(10, [[3, 1], [4, 1]]), flash(5, [2, 2], 6, 800)],
    },
  },
  {
    id: "C8",
    label: "Class 8",
    stage: "middle",
    ages: [12, 15],
    summary: "3–4 digit sums (5 rows), 3×2, division by 1–2 digits",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [3, 4], 5, "free", 0.4), mul(10, [[3, 2]]), div(10, [[4, 1], [4, 2]]), flash(5, [2, 2], 6, 700)],
    },
  },
  {
    id: "C9",
    label: "Class 9",
    stage: "senior",
    ages: [13, 16],
    summary: "4-digit sums (5 rows), 3×2 & 4×2, 4-digit ÷ 2-digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [4, 4], 5, "free", 0.4), mul(10, [[3, 2], [4, 2]]), div(10, [[4, 2]]), flash(5, [2, 2], 7, 700)],
    },
  },
  {
    id: "C10",
    label: "Class 10",
    stage: "senior",
    ages: [14, 17],
    summary: "4-digit sums (6 rows), 4×2, 4–5 digit ÷ 2-digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [4, 4], 6, "free", 0.4), mul(10, [[4, 2]]), div(10, [[4, 2], [5, 2]]), flash(5, [2, 2], 7, 600)],
    },
  },
  {
    id: "C11",
    label: "Class 11",
    stage: "senior",
    ages: [15, 18],
    summary: "4–5 digit sums (6 rows), 4×2 & 3×3, 5-digit ÷ 2-digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [4, 5], 6, "free", 0.4), mul(10, [[4, 2], [3, 3]]), div(10, [[5, 2]]), flash(5, [2, 2], 8, 600)],
    },
  },
  {
    id: "C12",
    label: "Class 12",
    stage: "senior",
    ages: [16, 18],
    summary: "5-digit sums (6 rows), 4×3, 5–6 digit ÷ 2–3 digit",
    paper: {
      durationSec: minutes(12),
      sections: [add(30, [5, 5], 6, "free", 0.4), mul(10, [[4, 3]]), div(10, [[5, 2], [6, 3]]), flash(5, [3, 3], 6, 900)],
    },
  },
];

export function gradeById(id: string) {
  return GRADES.find((g) => g.id === id);
}

export function gradeLabel(id: string) {
  return gradeById(id)?.label ?? id;
}

export function totalQuestions(p: PaperSpec) {
  return p.sections.reduce((n, s) => n + s.count, 0);
}

/** A shorter version of a paper for quick practice. */
export function quickVersion(p: PaperSpec): PaperSpec {
  return {
    durationSec: Math.max(120, Math.round(p.durationSec / 4)),
    sections: p.sections.map((s) => ({
      ...s,
      count: s.kind === "flash" ? 2 : Math.max(3, Math.round(s.count / 4)),
    })),
  };
}

const range = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** Plain-language description of one section, e.g. "2-digit add & subtract, 4 rows". */
export function describeSection(s: SectionSpec) {
  switch (s.kind) {
    case "addsub":
      return `${range(s.digits)}-digit ${s.subProb > 0 ? "add & subtract" : "addition"}, ${s.rows} rows${s.mode === "direct" ? " (direct moves)" : ""}`;
    case "mul":
      return `Multiplication ${s.shapes.map(([a, b]) => `${a}×${b} digit`).join(", ")}`;
    case "div":
      return `Division ${s.shapes.map(([a, b]) => `${a}÷${b} digit`).join(", ")}`;
    case "flash":
      return `Flash: ${s.rows} numbers of ${range(s.digits)} digit${s.digits[1] > 1 ? "s" : ""}, ${(s.intervalMs / 1000).toFixed(1)}s each`;
  }
}

export const DURATION_MINUTES = {
  min: Math.min(...GRADES.map((g) => g.paper.durationSec / 60)),
  max: Math.max(...GRADES.map((g) => g.paper.durationSec / 60)),
};
