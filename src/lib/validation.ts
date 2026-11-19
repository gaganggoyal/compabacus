import { MAX_AGE, MIN_AGE, ageOn } from "./config";
import { GRADES, gradeById } from "./exam/papers";

/** "+91 98765 43210", "098765 43210" → "9876543210". International numbers keep their "+". */
export function normalisePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^(\+?91|0)?[6-9]\d{9}$/.test(digits)) return digits.slice(-10);
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}

/** Age and class rules shared by parent and school registrations. */
export function eligibilityError(dob: string, gradeId: string): { field: "dob" | "grade"; message: string } | null {
  const age = ageOn(dob);
  if (Number.isNaN(age) || age < MIN_AGE || age > MAX_AGE) {
    return {
      field: "dob",
      message: `Students must be ${MIN_AGE}–${MAX_AGE} years old on 1 Dec 2026 (this date gives ${Number.isNaN(age) ? "?" : age})`,
    };
  }
  const grade = gradeById(gradeId);
  if (grade && (age < grade.ages[0] || age > grade.ages[1])) {
    return {
      field: "grade",
      message: `${grade.label} is for children aged ${grade.ages[0]}–${grade.ages[1]} on 1 Dec 2026, but this date of birth gives ${age}. Please check the class or date of birth.`,
    };
  }
  return null;
}

/** Accepts 2017-05-14, 14-05-2017, 14/05/2017 and 14.05.2017. Returns YYYY-MM-DD or null. */
export function parseDob(raw: string) {
  const s = raw.trim();
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

/** "Nursery", "nur", "LKG", "UKG", "3", "Class 3", "Std 3", "III", "C3" → class id. */
export function parseGrade(raw: string) {
  const s = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (gradeById(s)) return s;
  if (/^(NUR|NURSERY|PRE[- ]?NURSERY|PLAYGROUP|PG)$/.test(s)) return "NUR";
  if (/^(LKG|L\.K\.G\.?|JR\.? KG|JUNIOR KG)$/.test(s)) return "LKG";
  if (/^(UKG|U\.K\.G\.?|SR\.? KG|SENIOR KG)$/.test(s)) return "UKG";
  const m = s.match(/^(?:CLASS|STD|STANDARD|GRADE|C)?\.? ?([0-9]{1,2}|[IVX]{1,4})(?:ST|ND|RD|TH)?$/);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : ROMAN[m[1]];
  return n >= 1 && n <= 12 ? `C${n}` : null;
}

export const GRADE_OPTIONS = GRADES.map((g) => ({ id: g.id, label: g.label }));
