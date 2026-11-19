import "server-only";
import { examTestMode, phaseAt } from "./config";
import type { Attempt, Registration } from "./db/schema";
import { SUBMIT_GRACE_MS, attemptFor, finalizeAttempt, parseAnswers } from "./exam/server";
import { type Slot, slotAt, slotDay, slotHours } from "./slots";

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
  | { kind: "book" }
  | { kind: "slot_upcoming"; slot: Slot }
  | { kind: "open"; slot: Slot }
  | { kind: "slot_missed"; slot: Slot }
  | { kind: "in_progress" }
  | { kind: "done" }
  | { kind: "missed" };

/** A submitted UPI reference is enough to sit the exam; only verified payments are ranked. */
export function isPaid(reg: Pick<Registration, "paymentStatus">) {
  return reg.paymentStatus === "submitted" || reg.paymentStatus === "verified";
}

/** The exam can only be started during the student's booked one-hour slot. */
export function examGate(reg: Registration, attempt: Attempt | undefined, now: number): ExamGate {
  if (attempt?.status === "in_progress") return { kind: "in_progress" };
  if (attempt) return { kind: "done" };
  const paid = isPaid(reg);
  const slot = slotAt(reg.slotStart);
  if (examTestMode()) {
    if (!paid) return { kind: "pay" };
    return slot ? { kind: "open", slot } : { kind: "book" };
  }
  const phase = phaseAt(now);
  if (phase === "closed" || phase === "results") return { kind: "missed" };
  if (!paid) return { kind: "pay" };
  if (!slot) return { kind: "book" };
  if (now < slot.start) return { kind: "slot_upcoming", slot };
  if (now < slot.end) return { kind: "open", slot };
  return { kind: "slot_missed", slot };
}

/** Booking (or moving) a slot is allowed until the attempt starts. */
export function canBookSlot(reg: Registration, attempt: Attempt | undefined, now: number) {
  if (attempt || !isPaid(reg)) return false;
  const phase = phaseAt(now);
  return examTestMode() || phase === "upcoming" || phase === "live";
}

export function gateMessage(gate: ExamGate) {
  switch (gate.kind) {
    case "pay":
      return "Please complete the registration payment before starting the exam.";
    case "book":
      return "Please book your exam slot first.";
    case "slot_upcoming":
      return `Your exam slot is ${slotDay(gate.slot.start)}, ${slotHours(gate.slot)}. The exam opens when the slot starts.`;
    case "slot_missed":
      return "Your exam slot has ended. Book a new slot from your dashboard to take the exam.";
    case "missed":
      return "The exam window has closed.";
    default:
      return "";
  }
}
