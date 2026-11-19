import { count, desc, eq, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ResetSchoolPasswordButton, SchoolPaymentActions } from "@/components/admin/admin-forms";
import { Badge, PageLoading } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { rupees } from "@/lib/pricing";

export default function AdminSchoolsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Schools />
    </Suspense>
  );
}

function tone(s: string) {
  return s === "verified" ? "emerald" : s === "submitted" ? "amber" : s === "rejected" ? "rose" : "slate";
}

async function Schools() {
  await requireAdmin();
  const schools = await db
    .select()
    .from(schema.schools)
    .orderBy(sql`case ${schema.schools.paymentStatus} when 'submitted' then 0 else 1 end`, desc(schema.schools.createdAt));
  const students = await db
    .select({
      schoolId: schema.registrations.schoolId,
      n: count(),
      slotted: sql<number>`sum(case when ${schema.registrations.slotStart} is not null then 1 else 0 end)`,
    })
    .from(schema.registrations)
    .where(isNotNull(schema.registrations.schoolId))
    .groupBy(schema.registrations.schoolId);
  const byId = new Map(students.map((s) => [s.schoolId, s]));
  const [{ done }] = await db
    .select({ done: count() })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(isNotNull(schema.registrations.schoolId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Schools</h1>
          <p className="mt-1 text-sm text-ink/55">
            {schools.length} schools · {students.reduce((a, s) => a + s.n, 0)} students · {done} exams taken. A school&apos;s payment status is copied to all its
            students.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-ink/8 text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {schools.map((s) => {
              const st = byId.get(s.id);
              return (
                <tr key={s.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="font-mono text-xs text-ink/50">{s.code}</p>
                    <p className="text-xs text-ink/45">
                      {s.city}, {s.state}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{s.contactName}</p>
                    <a href={`https://wa.me/${s.phone.startsWith("+") ? s.phone.slice(1) : `91${s.phone}`}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                      {s.phone}
                    </a>
                    <p className="text-ink/45">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Link href={`/admin/registrations?school=${s.id}`} className="font-semibold text-indigo-600 hover:underline">
                      {st?.n ?? 0} students
                    </Link>
                    <p className="text-ink/50">{Number(st?.slotted ?? 0)} with a slot</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tone(s.paymentStatus)}>{s.paymentStatus}</Badge>
                    <p className="mt-1 text-xs font-semibold">{rupees(s.feeAmount)}</p>
                    {s.utr && <p className="font-mono text-[11px] text-ink/50">{s.utr}</p>}
                    {s.paymentNote && <p className="text-[11px] text-ink/50">{s.paymentNote}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/55">{fmtDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <SchoolPaymentActions id={s.id} status={s.paymentStatus} />
                      <ResetSchoolPasswordButton id={s.id} name={s.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!schools.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/45">
                  No schools yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
