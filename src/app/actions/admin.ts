"use server";

import { and, eq, inArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth";
import { hashSecret, randomDigits, safeEqual } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { computeResults } from "@/lib/results";
import { clearAdminSession, setAdminSession } from "@/lib/session";
import { type ResultsMode, setSetting } from "@/lib/settings";

export async function adminLoginAction(_prev: { message?: string }, formData: FormData): Promise<{ message?: string }> {
  const pw = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8) {
    return { message: "ADMIN_PASSWORD is not configured (min 8 characters)." };
  }
  // Small fixed delay blunts brute-force attempts.
  await new Promise((r) => setTimeout(r, 400));
  if (!safeEqual(pw, expected)) return { message: "Incorrect password." };
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function verifyPaymentAction(registrationId: string) {
  await assertAdmin();
  await db
    .update(schema.registrations)
    .set({ paymentStatus: "verified", paymentVerifiedAt: new Date(), paymentNote: null })
    .where(eq(schema.registrations.id, registrationId));
  refresh();
}

export async function rejectPaymentAction(registrationId: string, note: string) {
  await assertAdmin();
  await db
    .update(schema.registrations)
    .set({
      paymentStatus: "rejected",
      paymentVerifiedAt: null,
      paymentNote: note.trim().slice(0, 200) || "We could not find this transaction. Please check the UTR and re-submit.",
      utr: null,
    })
    .where(eq(schema.registrations.id, registrationId));
  refresh();
}

/** Mark as paid without a UTR — e.g. cash collected at a school. */
export async function markPaidManuallyAction(registrationId: string) {
  await assertAdmin();
  await db
    .update(schema.registrations)
    .set({ paymentStatus: "verified", paymentVerifiedAt: new Date(), paymentNote: "Marked paid by admin" })
    .where(eq(schema.registrations.id, registrationId));
  refresh();
}

export type BulkState = { matched?: number; unmatched?: string[]; message?: string };

/** Paste UTRs (or a whole bank statement) — every 10-22 char token that matches a pending UTR is verified. */
export async function bulkVerifyAction(_prev: BulkState, formData: FormData): Promise<BulkState> {
  await assertAdmin();
  const raw = String(formData.get("utrs") ?? "").toUpperCase();
  const tokens = Array.from(new Set(raw.match(/[A-Z0-9]{10,22}/g) ?? []));
  if (!tokens.length) return { message: "No transaction IDs found in the pasted text." };
  const pending = await db
    .select({ id: schema.registrations.id, utr: schema.registrations.utr })
    .from(schema.registrations)
    .where(and(eq(schema.registrations.paymentStatus, "submitted"), inArray(schema.registrations.utr, tokens)));
  if (pending.length) {
    await db
      .update(schema.registrations)
      .set({ paymentStatus: "verified", paymentVerifiedAt: new Date(), paymentNote: null })
      .where(
        inArray(
          schema.registrations.id,
          pending.map((p) => p.id),
        ),
      );
  }
  const matched = new Set(pending.map((p) => p.utr));
  refresh();
  return {
    matched: pending.length,
    unmatched: tokens.filter((t) => !matched.has(t) && /^\d{12}$/.test(t)).slice(0, 50),
  };
}

export async function resetPinAction(registrationId: string) {
  await assertAdmin();
  const pin = randomDigits(6);
  await db
    .update(schema.registrations)
    .set({ pinHash: await hashSecret(pin), failedLogins: 0, lockedUntil: null })
    .where(eq(schema.registrations.id, registrationId));
  return { pin };
}

export async function disqualifyAttemptAction(attemptId: string, reason: string) {
  await assertAdmin();
  await db
    .update(schema.attempts)
    .set({ status: "disqualified", adminNote: reason.trim().slice(0, 200) || "Disqualified for unfair means", rank: null, award: null })
    .where(eq(schema.attempts.id, attemptId));
  refresh();
}

export async function restoreAttemptAction(attemptId: string) {
  await assertAdmin();
  await db
    .update(schema.attempts)
    .set({ status: "submitted", adminNote: null, flagged: false })
    .where(and(eq(schema.attempts.id, attemptId), eq(schema.attempts.status, "disqualified")));
  refresh();
}

/** Allow a student to retake (e.g. a genuine technical failure). Deletes the attempt. */
export async function resetAttemptAction(attemptId: string) {
  await assertAdmin();
  await db.delete(schema.attempts).where(eq(schema.attempts.id, attemptId));
  refresh();
}

export async function computeResultsAction() {
  await assertAdmin();
  const r = await computeResults();
  refresh();
  return r;
}

export async function setResultsModeAction(mode: ResultsMode) {
  await assertAdmin();
  await setSetting("results_mode", mode);
  if (mode === "published") await computeResults();
  refresh();
}
