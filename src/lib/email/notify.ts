import "server-only";
import { and, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { after } from "next/server";
import { upiDetails } from "../config";
import { db, schema } from "../db";
import type { Registration } from "../db/schema";
import { deliver, deliverBatch } from "./send";
import { examSubmittedEmail, paymentRejectedEmail, paymentVerifiedEmail, pinResetEmail, registeredEmail, resultsEmail } from "./templates";

/** Runs after the response is sent, so a slow mail server never delays the parent's page. */
function later(label: string, fn: () => Promise<unknown>) {
  after(async () => {
    try {
      await fn();
    } catch (e) {
      console.error(`[email] ${label} failed`, e);
    }
  });
}

type RegKind = "registered" | "payment_verified" | "payment_rejected";

export function notifyRegistrations(kind: RegKind, ids: string[]) {
  if (!ids.length) return;
  later(kind, async () => {
    const rows = await db.query.registrations.findMany({ where: inArray(schema.registrations.id, ids) });
    for (const r of rows) {
      if (!r.email) continue;
      if (kind === "registered") {
        await deliver(kind, registeredEmail(r, upiDetails()), { registrationId: r.id, idempotencyKey: `registered-${r.id}` });
      } else if (kind === "payment_verified") {
        await deliver(kind, paymentVerifiedEmail(r), { registrationId: r.id, idempotencyKey: `verified-${r.id}-${r.paymentVerifiedAt?.getTime() ?? 0}` });
      } else {
        await deliver(kind, paymentRejectedEmail(r), { registrationId: r.id, idempotencyKey: `rejected-${r.id}-${r.paymentSubmittedAt?.getTime() ?? 0}` });
      }
    }
  });
}

export function notifyExamSubmitted(registrationId: string, attemptId: string, submittedAt: Date) {
  later("exam_submitted", async () => {
    const r = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, registrationId) });
    if (!r?.email) return;
    await deliver("exam_submitted", examSubmittedEmail(r, submittedAt), { registrationId, idempotencyKey: `submitted-${attemptId}` });
  });
}

export function sendPinReset(r: Registration, link: string) {
  later("pin_reset", () => deliver("pin_reset", pinResetEmail(r, link), { registrationId: r.id }));
}

/** Ranked students with an email who haven't been sent their result yet. */
export async function pendingResultEmails() {
  const rows = await db
    .select({ r: schema.registrations, a: schema.attempts })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(
      and(
        isNotNull(schema.attempts.rank),
        isNotNull(schema.attempts.award),
        isNotNull(schema.attempts.certNo),
        ne(schema.attempts.status, "disqualified"),
        isNotNull(schema.registrations.email),
      ),
    );
  const sent = await db
    .select({ id: schema.emailLog.registrationId })
    .from(schema.emailLog)
    .where(and(eq(schema.emailLog.kind, "results"), eq(schema.emailLog.status, "sent")));
  const done = new Set(sent.map((s) => s.id));
  return rows.filter(({ r }) => !done.has(r.id));
}

export function sendResultEmails(queue: Awaited<ReturnType<typeof pendingResultEmails>>) {
  later("results", () =>
    deliverBatch(
      "results",
      queue.map(({ r, a }) => ({
        registrationId: r.id,
        msg: resultsEmail(r, { award: a.award!, rank: a.rank!, score: a.score ?? 0, maxScore: a.maxScore ?? 0, certNo: a.certNo! }),
      })),
    ),
  );
}
