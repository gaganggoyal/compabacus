import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { Suspense } from "react";
import { BulkVerifyForm, PaymentActions, SchoolPaymentActions } from "@/components/admin/admin-forms";
import { Card, PageLoading } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { upiDetails } from "@/lib/config";
import { rupees } from "@/lib/pricing";
import { db, schema } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Payments />
    </Suspense>
  );
}

async function Payments() {
  await requireAdmin();
  const pending = await db
    .select()
    .from(schema.registrations)
    .where(and(eq(schema.registrations.paymentStatus, "submitted"), isNull(schema.registrations.schoolId)))
    .orderBy(asc(schema.registrations.paymentSubmittedAt))
    .limit(500);
  const rejected = await db
    .select()
    .from(schema.registrations)
    .where(and(eq(schema.registrations.paymentStatus, "rejected"), isNull(schema.registrations.schoolId)))
    .orderBy(desc(schema.registrations.createdAt))
    .limit(100);
  const schools = await db
    .select()
    .from(schema.schools)
    .where(eq(schema.schools.paymentStatus, "submitted"))
    .orderBy(asc(schema.schools.paymentSubmittedAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Payments</h1>
        <p className="mt-1 text-sm text-ink/55">
          Check each UTR against the credits to <b>{upiDetails().vpa}</b> in your bank or UPI business app. The expected amount is shown on each row (launch
          offer or regular price, fixed when they registered).
        </p>
      </div>

      <Card className="p-6">
        <p className="font-display text-lg font-bold">Bulk verify</p>
        <p className="mb-4 mt-1 text-sm text-ink/55">
          Download your bank / UPI statement for the day, copy all the rows and paste them here. Every pending registration whose UTR appears in the text
          is verified in one go.
        </p>
        <BulkVerifyForm />
      </Card>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
        <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
          <p className="font-display font-bold">Awaiting verification</p>
          <span className="text-sm text-ink/55">{pending.length}</span>
        </div>
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">UTR</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {pending.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono font-semibold">{r.utr}</td>
                <td className="px-4 py-3 font-semibold">{rupees(r.feeAmount)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.studentName}</p>
                  <p className="font-mono text-xs text-ink/50">{r.regNo}</p>
                </td>
                <td className="px-4 py-3 text-xs">{r.phone}</td>
                <td className="px-4 py-3 text-xs text-ink/55">{r.paymentSubmittedAt ? fmtDateTime(r.paymentSubmittedAt) : "—"}</td>
                <td className="px-4 py-3">
                  <PaymentActions id={r.id} status={r.paymentStatus} />
                </td>
              </tr>
            ))}
            {!pending.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/45">
                  All caught up — nothing to verify. 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {schools.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
          <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
            <p className="font-display font-bold">Schools awaiting verification</p>
            <span className="text-sm text-ink/55">{schools.length}</span>
          </div>
          <table className="w-full min-w-[44rem] text-left text-sm">
            <tbody className="divide-y divide-ink/6">
              {schools.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono font-semibold">{s.utr}</td>
                  <td className="px-4 py-3 font-semibold">{rupees(s.feeAmount)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="font-mono text-xs text-ink/50">{s.code}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{s.phone}</td>
                  <td className="px-4 py-3 text-xs text-ink/55">{s.paymentSubmittedAt ? fmtDateTime(s.paymentSubmittedAt) : "—"}</td>
                  <td className="px-4 py-3">
                    <SchoolPaymentActions id={s.id} status={s.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
          <p className="border-b border-ink/8 px-4 py-3 font-display font-bold">Rejected (waiting for parent to re-submit)</p>
          <table className="w-full min-w-[40rem] text-left text-sm">
            <tbody className="divide-y divide-ink/6">
              {rejected.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.studentName}</p>
                    <p className="font-mono text-xs text-ink/50">{r.regNo}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{r.phone}</td>
                  <td className="px-4 py-3 text-xs text-ink/55">{r.paymentNote}</td>
                  <td className="px-4 py-3">
                    <PaymentActions id={r.id} status={r.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
