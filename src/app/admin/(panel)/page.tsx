import { count, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { Download, TriangleExclamationPoint } from "lucide-react";
import Link from "next/link";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { Card, PageLoading } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { examTestMode, phaseAt, upiDetails } from "@/lib/config";
import { db, schema } from "@/lib/db";
import { GRADES } from "@/lib/exam/papers";
import { finalizeExpiredAttempts } from "@/lib/exam/server";
import { inr } from "@/lib/format";
import { getResultsMode } from "@/lib/settings";

export default function AdminHome() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await requireAdmin();
  const now = await requestNow();
  await finalizeExpiredAttempts(now);

  // Payment counts are for parent registrations; school students share their school's payment.
  const pay = await db
    .select({ s: schema.registrations.paymentStatus, n: count() })
    .from(schema.registrations)
    .where(isNull(schema.registrations.schoolId))
    .groupBy(schema.registrations.paymentStatus);
  const byPay = Object.fromEntries(pay.map((p) => [p.s, p.n])) as Record<string, number>;
  const [{ total }] = await db.select({ total: count() }).from(schema.registrations);
  const [{ schoolStudents }] = await db.select({ schoolStudents: count() }).from(schema.registrations).where(isNotNull(schema.registrations.schoolId));

  const att = await db.select({ s: schema.attempts.status, n: count() }).from(schema.attempts).groupBy(schema.attempts.status);
  const byAtt = Object.fromEntries(att.map((p) => [p.s, p.n])) as Record<string, number>;
  const [{ flagged }] = await db
    .select({ flagged: count() })
    .from(schema.attempts)
    .where(eq(schema.attempts.flagged, true));

  const perGrade = await db
    .select({ g: schema.registrations.grade, n: count() })
    .from(schema.registrations)
    .groupBy(schema.registrations.grade);
  const gradeCount = (id: string) => perGrade.find((m) => m.g === id)?.n ?? 0;
  const maxGrade = Math.max(1, ...perGrade.map((m) => m.n));

  const daily = await db
    .select({
      d: sql<string>`strftime('%Y-%m-%d', ${schema.registrations.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`,
      n: count(),
    })
    .from(schema.registrations)
    .groupBy(sql`1`)
    .orderBy(sql`1 desc`)
    .limit(14);
  const days = [...daily].reverse();
  const maxDay = Math.max(1, ...days.map((d) => d.n));

  // Revenue = each verified registration's own fee (0 for school students) + verified school fees.
  const [{ studentRevenue }] = await db
    .select({ studentRevenue: sql<number>`coalesce(sum(${schema.registrations.feeAmount}), 0)` })
    .from(schema.registrations)
    .where(eq(schema.registrations.paymentStatus, "verified"));
  const schoolPay = await db
    .select({ s: schema.schools.paymentStatus, n: count(), fees: sql<number>`coalesce(sum(${schema.schools.feeAmount}), 0)` })
    .from(schema.schools)
    .groupBy(schema.schools.paymentStatus);
  const schoolsTotal = schoolPay.reduce((a, p) => a + p.n, 0);
  const schoolRevenue = schoolPay.find((p) => p.s === "verified")?.fees ?? 0;
  const schoolsWaiting = schoolPay.find((p) => p.s === "submitted")?.n ?? 0;
  const [{ slotted }] = await db.select({ slotted: count() }).from(schema.registrations).where(isNotNull(schema.registrations.slotStart));

  const mode = await getResultsMode();
  const warnings: string[] = [];
  if (upiDetails().vpa === "yourname@upi") warnings.push("UPI_ID is still the placeholder — set your real UPI ID in the environment.");
  if (examTestMode()) warnings.push("EXAM_TEST_MODE is ON — students can start the exam outside the December window. Turn it off before going live.");
  if (mode !== "auto") warnings.push(`Results mode is “${mode}” (overrides the scheduled reveal).`);

  const stats = [
    { k: total, v: "Registrations" },
    { k: byPay.verified ?? 0, v: "Payments verified" },
    { k: inr(Number(studentRevenue) + Number(schoolRevenue)), v: "Verified revenue" },
    { k: (byPay.submitted ?? 0) + schoolsWaiting, v: "Awaiting verification", href: "/admin/payments" },
    { k: `${schoolsTotal} · ${schoolStudents}`, v: "Schools · their students", href: "/admin/schools" },
    { k: slotted, v: "Slots booked", href: "/admin/slots" },
    { k: (byPay.unpaid ?? 0) + (byPay.rejected ?? 0), v: "Unpaid / rejected" },
    { k: byAtt.in_progress ?? 0, v: "Exams in progress" },
    { k: (byAtt.submitted ?? 0) + (byAtt.disqualified ?? 0), v: "Exams completed" },
    { k: flagged, v: "Flagged for review", href: "/admin/attempts?filter=flagged" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Overview</h1>
          <p className="text-sm text-ink/55">Phase: {phaseAt(now)}</p>
        </div>
        <div className="flex gap-2">
          {/* Plain <a>: these are CSV file downloads, not page navigations. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/export/registrations" className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-ink/10 hover:ring-ink/25">
            <Download className="h-4 w-4" /> Registrations CSV
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/export/results" className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-ink/10 hover:ring-ink/25">
            <Download className="h-4 w-4" /> Results CSV
          </a>
        </div>
      </div>

      {warnings.map((w) => (
        <div key={w} className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <TriangleExclamationPoint className="mt-0.5 h-4 w-4 shrink-0" /> {w}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <>
              <p className="font-display text-3xl font-bold tabular-nums">{s.k}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ink/45">{s.v}</p>
            </>
          );
          return s.href ? (
            <Link key={s.v} href={s.href} className="rounded-2xl bg-white p-5 ring-1 ring-ink/8 transition hover:ring-indigo-300">
              {inner}
            </Link>
          ) : (
            <div key={s.v} className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="font-display text-lg font-bold">Registrations per day (last 14 days)</p>
          {days.length ? (
            <div className="mt-6 flex h-44 items-end gap-2">
              {days.map((d) => (
                <div key={d.d} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold tabular-nums text-ink/60">{d.n}</span>
                  <div className="w-full rounded-t-md bg-indigo-500" style={{ height: Math.max(4, Math.round((d.n / maxDay) * 130)) }} />
                  <span className="text-[10px] text-ink/45">{d.d.slice(8)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-ink/50">No registrations yet.</p>
          )}
        </Card>
        <Card className="p-6">
          <p className="font-display text-lg font-bold">Registrations by class</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {GRADES.map((g) => {
              const n = gradeCount(g.id);
              return (
                <li key={g.id} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="font-semibold">{g.label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-ink/5">
                    <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(n / maxGrade) * 100}%` }} />
                  </span>
                  <span className={n ? "text-right font-semibold tabular-nums" : "text-right tabular-nums text-ink/30"}>{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
