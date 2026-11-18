import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "../db";
import type { Attempt } from "../db/schema";
import { type Answers, type Paper, allQuestionIds, scorePaper } from "./generator";

/** Grace period after the deadline for the final autosave/submit to arrive. */
export const SUBMIT_GRACE_MS = 15_000;
export const FLAG_FOCUS_LOSSES = 3;

export function parsePaper(a: Pick<Attempt, "paper">): Paper {
  return JSON.parse(a.paper) as Paper;
}

export function parseAnswers(a: Pick<Attempt, "answers">): Answers {
  try {
    return JSON.parse(a.answers) as Answers;
  } catch {
    return {};
  }
}

/** Keep only known question ids with short numeric-ish values. */
export function sanitiseAnswers(paper: Paper, raw: unknown): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  const ids = new Set(allQuestionIds(paper));
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ids.has(k) || typeof v !== "string") continue;
    const t = v.trim().slice(0, 14);
    if (t && /^-?[\d,\s]*$/.test(t)) out[k] = t;
  }
  return out;
}

export async function finalizeAttempt(attempt: Attempt, answers: Answers, focusLosses: number, now = Date.now()) {
  const paper = parsePaper(attempt);
  const { score, max } = scorePaper(paper, answers);
  const deadline = attempt.deadlineAt.getTime();
  const submittedAt = Math.min(now, deadline);
  const losses = Math.max(attempt.focusLosses, focusLosses);
  await db
    .update(schema.attempts)
    .set({
      answers: JSON.stringify(answers),
      status: "submitted",
      submittedAt: new Date(submittedAt),
      lastSavedAt: new Date(now),
      score,
      maxScore: max,
      timeTakenMs: Math.max(0, submittedAt - attempt.startedAt.getTime()),
      focusLosses: losses,
      flagged: attempt.flagged || losses >= FLAG_FOCUS_LOSSES,
    })
    .where(and(eq(schema.attempts.id, attempt.id), eq(schema.attempts.status, "in_progress")));
  return { score, max };
}

/** Auto-submit any attempt whose time ran out without an explicit submit (closed tab, lost network…). */
export async function finalizeExpiredAttempts(now = Date.now()) {
  const expired = await db.query.attempts.findMany({
    where: and(eq(schema.attempts.status, "in_progress"), lt(schema.attempts.deadlineAt, new Date(now - SUBMIT_GRACE_MS))),
  });
  for (const a of expired) {
    await finalizeAttempt(a, parseAnswers(a), a.focusLosses, now);
  }
  return expired.length;
}

export async function attemptFor(registrationId: string) {
  return db.query.attempts.findFirst({ where: eq(schema.attempts.registrationId, registrationId) });
}
