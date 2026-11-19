import { and, count, desc, eq, gte } from "drizzle-orm";
import { Suspense } from "react";
import { SendResultEmailsButton, TestEmailForm } from "@/components/admin/admin-forms";
import { Badge, Card, PageLoading } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { pendingResultEmails } from "@/lib/email/notify";
import { emailSettings } from "@/lib/email/send";
import { fmtDateTime } from "@/lib/format";
import { requestNow } from "@/lib/now";
import { resultsLive } from "@/lib/results";

const KIND_LABEL: Record<string, string> = {
  registered: "Registration",
  payment_verified: "Payment verified",
  payment_rejected: "Payment rejected",
  exam_submitted: "Exam submitted",
  results: "Result",
  pin_reset: "PIN reset",
  test: "Test",
};

export default function AdminEmailsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminEmails />
    </Suspense>
  );
}

async function AdminEmails() {
  await requireAdmin();
  const now = await requestNow();
  const cfg = emailSettings();
  const totals = await db.select({ status: schema.emailLog.status, n: count() }).from(schema.emailLog).groupBy(schema.emailLog.status);
  const total = (s: string) => totals.find((t) => t.status === s)?.n ?? 0;
  const [{ n: resultsSent }] = await db.select({ n: count() }).from(schema.emailLog).where(eq(schema.emailLog.kind, "results"));
  const [{ n: sentLastDay }] = await db
    .select({ n: count() })
    .from(schema.emailLog)
    .where(and(eq(schema.emailLog.status, "sent"), gte(schema.emailLog.createdAt, new Date(now - 24 * 60 * 60 * 1000))));
  const recent = await db.select().from(schema.emailLog).orderBy(desc(schema.emailLog.createdAt)).limit(80);
  const live = await resultsLive(now);
  const pending = live ? (await pendingResultEmails()).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Emails</h1>
        <p className="mt-1 text-sm text-ink/55">
          Parents get an email when they register, when a payment is verified or rejected, when the exam is submitted, and for PIN resets.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-bold">Sending</p>
            <Badge tone={cfg.enabled ? "emerald" : "rose"}>{cfg.enabled ? "On" : "Off: RESEND_API_KEY not set"}</Badge>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink/50">From</dt>
              <dd className="font-medium">{cfg.from}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/50">Replies go to</dt>
              <dd className="font-medium">{cfg.replyTo}</dd>
            </div>
          </dl>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {(
              [
                ["sent", "Sent", "text-emerald-700"],
                ["failed", "Failed", "text-rose-700"],
                ["skipped", "Not sent (off)", "text-ink/60"],
              ] as const
            ).map(([k, l, c]) => (
              <div key={k} className="rounded-2xl bg-ink/3 px-3 py-3">
                <p className={`font-display text-2xl font-bold ${c}`}>{total(k)}</p>
                <p className="text-xs text-ink/55">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/55">{sentLastDay} sent in the last 24 hours. Resend&apos;s free plan allows 100 a day.</p>
          <div className="mt-6 border-t border-ink/8 pt-5">
            <p className="text-sm font-semibold">Send a test email</p>
            <TestEmailForm />
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-display text-lg font-bold">Result emails</p>
          <p className="mt-1 text-sm text-ink/55">
            After results are published, send every family their award and certificate link in one click. Already-emailed families are skipped,
            so it&apos;s safe to click again. On Resend&apos;s free plan at most 100 go out per day: if some are still waiting, click again the
            next day.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-ink/3 px-3 py-3">
              <p className="font-display text-2xl font-bold">{pending}</p>
              <p className="text-xs text-ink/55">waiting</p>
            </div>
            <div className="rounded-2xl bg-ink/3 px-3 py-3">
              <p className="font-display text-2xl font-bold">{resultsSent}</p>
              <p className="text-xs text-ink/55">attempted so far</p>
            </div>
          </div>
          <div className="mt-4">
            <SendResultEmailsButton disabled={!live || !pending} reason={!live ? "Available once results are public." : !pending ? "Nothing waiting." : undefined} />
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-ink/8 text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {recent.map((m) => (
              <tr key={m.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink/55">{fmtDateTime(m.createdAt)}</td>
                <td className="px-4 py-3 text-xs font-semibold">{KIND_LABEL[m.kind] ?? m.kind}</td>
                <td className="px-4 py-3 text-xs">{m.to}</td>
                <td className="px-4 py-3 text-xs text-ink/70">{m.subject}</td>
                <td className="px-4 py-3">
                  <Badge tone={m.status === "sent" ? "emerald" : m.status === "failed" ? "rose" : "slate"}>{m.status}</Badge>
                  {m.error && <p className="mt-1 max-w-xs text-[11px] text-rose-700">{m.error}</p>}
                </td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/45">
                  No emails yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
