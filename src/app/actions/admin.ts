"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth";
import { hashSecret, randomDigits, safeEqual } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { notifyRegistrations, pendingResultEmails, sendResultEmails } from "@/lib/email/notify";
import { EMAIL_RE, deliver, emailSettings } from "@/lib/email/send";
import { testEmail } from "@/lib/email/templates";
import { computeResults, resultsLive } from "@/lib/results";
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
  const changed = await db
    .update(schema.registrations)
    .set({ paymentStatus: "verified", paymentVerifiedAt: new Date(), paymentNote: null })
    .where(and(eq(schema.registrations.id, registrationId), ne(schema.registrations.paymentStatus, "verified")))
    .returning({ id: schema.registrations.id });
  notifyRegistrations("payment_verified", changed.map((c) => c.id));
  refresh();
}

export async function rejectPaymentAction(registrationId: string, note: string) {
  await assertAdmin();
  const changed = await db
    .update(schema.registrations)
    .set({
      paymentStatus: "rejected",
      paymentVerifiedAt: null,
      paymentNote: note.trim().slice(0, 200) || "We could not find this transaction. Please check the UTR and re-submit.",
      utr: null,
    })
    .where(and(eq(schema.registrations.id, registrationId), ne(schema.registrations.paymentStatus, "rejected")))
    .returning({ id: schema.registrations.id });
  notifyRegistrations("payment_rejected", changed.map((c) => c.id));
  refresh();
}

/** Mark as paid without a UTR — e.g. cash collected at a school. */
export async function markPaidManuallyAction(registrationId: string) {
  await assertAdmin();
  const changed = await db
    .update(schema.registrations)
    .set({ paymentStatus: "verified", paymentVerifiedAt: new Date(), paymentNote: "Marked paid by admin" })
    .where(and(eq(schema.registrations.id, registrationId), ne(schema.registrations.paymentStatus, "verified")))
    .returning({ id: schema.registrations.id });
  notifyRegistrations("payment_verified", changed.map((c) => c.id));
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
    notifyRegistrations("payment_verified", pending.map((p) => p.id));
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

export type EmailActionState = { ok?: boolean; message?: string };

export async function sendTestEmailAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  await assertAdmin();
  const to = String(formData.get("to") ?? "").trim();
  if (!EMAIL_RE.test(to)) return { message: "Enter a valid email address." };
  const ok = await deliver("test", testEmail(to));
  refresh();
  if (ok) return { ok: true, message: `Sent to ${to}. Check the inbox and the spam folder.` };
  return {
    message: emailSettings().enabled
      ? "Sending failed. The reason is in the log below."
      : "Email isn't switched on yet (RESEND_API_KEY is not set), so the test was only logged.",
  };
}

/** Emails every ranked student's parent their result and certificate link. Safe to click again: already-emailed families are skipped. */
export async function sendResultEmailsAction(): Promise<EmailActionState> {
  await assertAdmin();
  if (!(await resultsLive(Date.now()))) return { message: "Publish the results first, then send the emails." };
  const queue = await pendingResultEmails();
  if (!queue.length) return { ok: true, message: "Every ranked student with an email has already been sent their result." };
  sendResultEmails(queue);
  return { ok: true, message: `Sending ${queue.length} result emails in the background. Refresh this page in a minute to see progress.` };
}
