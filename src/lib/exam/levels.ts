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

export type LevelSpec = {
  id: string;
  name: string;
  short: string;
  description: string;
  suitedFor: string;
  durationSec: number;
  sections: SectionSpec[];
};

export const LEVELS: LevelSpec[] = [
  {
    id: "L0",
    name: "Starter",
    short: "1-digit · 3 rows · addition",
    description: "Single-digit addition, 3 rows, direct bead moves only (no formulas).",
    suitedFor: "Children who have just started abacus",
    durationSec: 8 * 60,
    sections: [
      { id: "A", title: "Addition", kind: "addsub", count: 30, digits: [1, 1], rows: 3, mode: "direct", subProb: 0 },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [1, 1], rows: 3, intervalMs: 1500 },
    ],
  },
  {
    id: "L1",
    name: "Beginner",
    short: "1-digit · 4 rows · ± direct",
    description: "Single-digit addition & subtraction, 4 rows, direct moves (no small/big friends).",
    suitedFor: "Level 1 abacus students",
    durationSec: 8 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 40, digits: [1, 1], rows: 4, mode: "direct", subProb: 0.4 },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [1, 1], rows: 4, intervalMs: 1200 },
    ],
  },
  {
    id: "L2",
    name: "Junior",
    short: "1-digit · 5 rows · formulas",
    description: "Single-digit addition & subtraction, 5 rows, using small & big friends (5/10 complements).",
    suitedFor: "Level 2–3 abacus students",
    durationSec: 10 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 40, digits: [1, 1], rows: 5, mode: "free", subProb: 0.4 },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [1, 1], rows: 5, intervalMs: 1000 },
    ],
  },
  {
    id: "L3",
    name: "Intermediate",
    short: "2-digit · 4 rows · 2×1",
    description: "Two-digit addition & subtraction (4 rows) and 2-digit × 1-digit multiplication.",
    suitedFor: "Level 4 abacus students",
    durationSec: 10 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 35, digits: [2, 2], rows: 4, mode: "free", subProb: 0.4 },
      { id: "M", title: "Multiplication", kind: "mul", count: 15, shapes: [[2, 1]] },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [1, 1], rows: 5, intervalMs: 800 },
    ],
  },
  {
    id: "L4",
    name: "Advanced",
    short: "2-digit · 5 rows · × ÷",
    description: "Two-digit sums (5 rows), 2–3 digit × 1-digit multiplication and division by 1 digit.",
    suitedFor: "Level 5–6 abacus students",
    durationSec: 12 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 30, digits: [2, 2], rows: 5, mode: "free", subProb: 0.4 },
      { id: "M", title: "Multiplication", kind: "mul", count: 15, shapes: [[2, 1], [3, 1]] },
      { id: "D", title: "Division", kind: "div", count: 10, shapes: [[2, 1], [3, 1]] },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [2, 2], rows: 5, intervalMs: 1000 },
    ],
  },
  {
    id: "L5",
    name: "Expert",
    short: "3-digit · 5 rows · 2×2",
    description: "Three-digit sums (5 rows), 3×1 and 2×2 multiplication, 3–4 digit ÷ 1-digit division.",
    suitedFor: "Level 7–8 abacus students",
    durationSec: 12 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 30, digits: [3, 3], rows: 5, mode: "free", subProb: 0.4 },
      { id: "M", title: "Multiplication", kind: "mul", count: 15, shapes: [[3, 1], [2, 2]] },
      { id: "D", title: "Division", kind: "div", count: 10, shapes: [[3, 1], [4, 1]] },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [2, 2], rows: 6, intervalMs: 800 },
    ],
  },
  {
    id: "L6",
    name: "Grand Master",
    short: "3–4 digit · 6 rows · 3×2",
    description: "Mixed 3–4 digit sums (6 rows), 3×2 and 4×1 multiplication, 4-digit ÷ 2-digit division.",
    suitedFor: "Course-completed & advanced students",
    durationSec: 12 * 60,
    sections: [
      { id: "A", title: "Add & Subtract", kind: "addsub", count: 30, digits: [3, 4], rows: 6, mode: "free", subProb: 0.4 },
      { id: "M", title: "Multiplication", kind: "mul", count: 15, shapes: [[3, 2], [4, 1]] },
      { id: "D", title: "Division", kind: "div", count: 10, shapes: [[4, 2], [4, 1]] },
      { id: "F", title: "Flash Round", kind: "flash", count: 5, digits: [2, 2], rows: 7, intervalMs: 700 },
    ],
  },
];

export function levelById(id: string) {
  return LEVELS.find((l) => l.id === id);
}

export function totalQuestions(level: LevelSpec) {
  return level.sections.reduce((n, s) => n + s.count, 0);
}

/** A shorter version of a level for quick practice. */
export function quickVersion(level: LevelSpec): LevelSpec {
  return {
    ...level,
    durationSec: Math.max(120, Math.round(level.durationSec / 4)),
    sections: level.sections.map((s) => ({
      ...s,
      count: s.kind === "flash" ? 2 : Math.max(3, Math.round(s.count / 4)),
    })),
  };
}
