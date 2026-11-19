import "server-only";
import { site } from "../config";
import { newId } from "../crypto";
import { db, schema } from "../db";
import type { EmailKind, EmailStatus } from "../db/schema";
import type { EmailMessage } from "./templates";

const API = "https://api.resend.com";
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Resend allows about 2 requests per second per account, shared with any other app using the same account. */
const MIN_GAP_MS = 600;
const BATCH_SIZE = 100;

export function emailSettings() {
  return {
    enabled: !!process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || `${site.shortName} <noreply@${site.domain}>`,
    replyTo: process.env.EMAIL_REPLY_TO || site.contact.email,
  };
}

let chain: Promise<unknown> = Promise.resolve();
let lastCall = 0;

/** Runs provider calls one at a time with a small gap, so bursts (bulk payment verification) never hit the rate limit. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run;
}

/** A refused or failed provider call. `quota` means the plan's allowance is used up (Resend Free plan: 100 emails a day). */
class ResendError extends Error {
  constructor(
    message: string,
    readonly quota: boolean,
  ) {
    super(message);
  }
}

async function resend(path: string, body: unknown, idempotencyKey?: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    let status = 0;
    let detail = "";
    try {
      const res = await throttled(() =>
        fetch(`${API}${path}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        }),
      );
      if (res.ok) return await res.json();
      status = res.status;
      detail = (await res.text()).slice(0, 300);
    } catch (e) {
      detail = e instanceof Error ? e.message : String(e);
    }
    // A used-up daily or monthly allowance only resets later, so retrying now can't help.
    const quota = status === 429 && /quota/i.test(detail);
    const retryable = !quota && (status === 0 || status === 429 || status >= 500);
    if (!retryable || attempt >= 3) throw new ResendError(`Resend ${status || "network error"}: ${detail}`, quota);
    await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
  }
}

type LogRow = typeof schema.emailLog.$inferInsert;

async function log(rows: LogRow[]) {
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) await db.insert(schema.emailLog).values(rows.slice(i, i + BATCH_SIZE));
  } catch (e) {
    console.error("[email] could not write the email log", e);
  }
}

type Owner = { registrationId: string | null; schoolId: string | null };

function logRow(kind: EmailKind, msg: EmailMessage, owner: Owner, status: EmailStatus, extra: Partial<LogRow> = {}): LogRow {
  return { id: newId(), ...owner, kind, to: msg.to, subject: msg.subject, status, createdAt: new Date(), ...extra };
}

const forReg = (registrationId: string): Owner => ({ registrationId, schoolId: null });

function payload(kind: EmailKind, msg: EmailMessage) {
  const cfg = emailSettings();
  return { from: cfg.from, to: [msg.to], reply_to: cfg.replyTo, subject: msg.subject, html: msg.html, text: msg.text, tags: [{ name: "kind", value: kind }] };
}

function skippedNotice(kind: EmailKind, msg: EmailMessage) {
  console.info(`[email] ${kind} not sent (RESEND_API_KEY is not set) -> ${msg.to} | ${msg.subject}`);
  if (process.env.EMAIL_LOG_BODY === "true") console.info(msg.text);
}

/** Sends one email and records the outcome. Never throws: a failed email must never break registration or payments. */
export async function deliver(
  kind: EmailKind,
  msg: EmailMessage,
  opts: { registrationId?: string | null; schoolId?: string | null; idempotencyKey?: string } = {},
) {
  const owner: Owner = { registrationId: opts.registrationId ?? null, schoolId: opts.schoolId ?? null };
  if (!EMAIL_RE.test(msg.to)) {
    await log([logRow(kind, msg, owner, "failed", { error: "Invalid email address" })]);
    return false;
  }
  if (!emailSettings().enabled) {
    skippedNotice(kind, msg);
    await log([logRow(kind, msg, owner, "skipped")]);
    return false;
  }
  try {
    const r = (await resend("/emails", payload(kind, msg), opts.idempotencyKey)) as { id?: string };
    await log([logRow(kind, msg, owner, "sent", { providerId: r.id ?? null })]);
    return true;
  } catch (e) {
    const error = (e instanceof Error ? e.message : String(e)).slice(0, 500);
    console.error(`[email] ${kind} failed -> ${msg.to}: ${error}`);
    await log([logRow(kind, msg, owner, "failed", { error })]);
    return false;
  }
}

/** Sends many emails using the batch endpoint (100 per call), e.g. results for every student. */
export async function deliverBatch(kind: EmailKind, items: { msg: EmailMessage; registrationId: string }[]) {
  const invalid = items.filter((i) => !EMAIL_RE.test(i.msg.to));
  const valid = items.filter((i) => EMAIL_RE.test(i.msg.to));
  await log(invalid.map((i) => logRow(kind, i.msg, forReg(i.registrationId), "failed", { error: "Invalid email address" })));
  if (!emailSettings().enabled) {
    valid.forEach((i) => skippedNotice(kind, i.msg));
    await log(valid.map((i) => logRow(kind, i.msg, forReg(i.registrationId), "skipped")));
    return { sent: 0, failed: invalid.length, skipped: valid.length };
  }
  let sent = 0;
  let failed = invalid.length;
  for (let k = 0; k < valid.length; k += BATCH_SIZE) {
    const chunk = valid.slice(k, k + BATCH_SIZE);
    try {
      const r = (await resend("/emails/batch", chunk.map((i) => payload(kind, i.msg)))) as { data?: { id: string }[] };
      await log(chunk.map((i, j) => logRow(kind, i.msg, forReg(i.registrationId), "sent", { providerId: r.data?.[j]?.id ?? null })));
      sent += chunk.length;
    } catch (e) {
      const error = (e instanceof Error ? e.message : String(e)).slice(0, 500);
      console.error(`[email] ${kind} batch failed: ${error}`);
      await log(chunk.map((i) => logRow(kind, i.msg, forReg(i.registrationId), "failed", { error })));
      failed += chunk.length;
      if (e instanceof ResendError && e.quota) {
        // The rest would fail too. They stay waiting, so the next "Send result emails" click (e.g. tomorrow) picks them up.
        console.warn(`[email] ${kind}: sending limit reached, ${valid.length - k - chunk.length} emails left waiting`);
        break;
      }
    }
  }
  return { sent, failed, skipped: 0 };
}
