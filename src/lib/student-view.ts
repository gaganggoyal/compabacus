import "server-only";
import { examTestMode, phaseAt } from "./config";
import type { Attempt, Registration } from "./db/schema";
import { SUBMIT_GRACE_MS, attemptFor, finalizeAttempt, parseAnswers } from "./exam/server";

/** Loads the student's attempt, auto-submitting it first if time ran out. */
export async function freshAttempt(reg: Registration, now: number): Promise<Attempt | undefined> {
  const a = await attemptFor(reg.id);
  if (a && a.status === "in_progress" && a.deadlineAt.getTime() + SUBMIT_GRACE_MS < now) {
    await finalizeAttempt(a, parseAnswers(a), a.focusLosses, now);
    return attemptFor(reg.id);
  }
  return a;
}

export type ExamGate =
  | { kind: "pay" }
  | { kind: "upcoming" }
  | { kind: "open" }
  | { kind: "in_progress" }
  | { kind: "done" }
  | { kind: "missed" };

export function examGate(reg: Registration, attempt: Attempt | undefined, now: number): ExamGate {
  if (attempt?.status === "in_progress") return { kind: "in_progress" };
  if (attempt) return { kind: "done" };
  const paid = reg.paymentStatus === "submitted" || reg.paymentStatus === "verified";
  const phase = phaseAt(now);
  if (examTestMode()) return paid ? { kind: "open" } : { kind: "pay" };
  if (phase === "closed" || phase === "results") return { kind: "missed" };
  if (!paid) return { kind: "pay" };
  if (phase === "upcoming") return { kind: "upcoming" };
  return { kind: "open" };
}
