import { CalendarClock, CheckCircle2, Download, IndianRupee, LogOut, Printer, QrCode, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { asc, eq, inArray } from "drizzle-orm";
import { schoolLogoutAction } from "@/app/actions/school";
import { CopyButton } from "@/components/copy-button";
import { AddStudentForm, BulkAddForm, BulkBookForm, StudentActions, StudentPin } from "@/components/forms/school-forms";
import { Badge, Card, PageLoading, btn, cn } from "@/components/ui";
import { currentSchool } from "@/lib/auth";
import { decryptPin } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { GRADES, gradeLabel } from "@/lib/exam/papers";
import { AWARD_META } from "@/lib/format";
import { requestNow } from "@/lib/now";
import { rupees } from "@/lib/pricing";
import { resultsLive } from "@/lib/results";
import { slotAt, slotDay, slotTime } from "@/lib/slots";
import { bookedCounts } from "@/lib/slots-server";

export const metadata: Metadata = { title: "School dashboard", robots: { index: false } };

export default function SchoolDashboardPage({ searchParams }: PageProps<"/schools/dashboard">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <SchoolDashboard searchParams={searchParams} />
    </Suspense>
  );
}

const ORDER = new Map(GRADES.map((g, i) => [g.id, i]));

async function SchoolDashboard({ searchParams }: { searchParams: PageProps<"/schools/dashboard">["searchParams"] }) {
  const now = await requestNow();
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  const { booked } = await searchParams;
  // Before reading attempts: the first visit after the reveal ranks everyone (see resultsLive).
  const live = await resultsLive(now);

  const students = (
    await db.select().from(schema.registrations).where(eq(schema.registrations.schoolId, school.id)).orderBy(asc(schema.registrations.studentName))
  ).sort((a, b) => (ORDER.get(a.grade) ?? 99) - (ORDER.get(b.grade) ?? 99));
  const attempts = students.length
    ? await db
        .select({
          registrationId: schema.attempts.registrationId,
          status: schema.attempts.status,
          score: schema.attempts.score,
          maxScore: schema.attempts.maxScore,
          award: schema.attempts.award,
        })
        .from(schema.attempts)
        .where(
          inArray(
            schema.attempts.registrationId,
            students.map((s) => s.id),
          ),
        )
    : [];
  const byReg = new Map(attempts.map((a) => [a.registrationId, a]));
  const counts = await bookedCounts();
  const paid = school.paymentStatus === "submitted" || school.paymentStatus === "verified";
  const withSlot = students.filter((s) => s.slotStart).length;
  const done = attempts.filter((a) => a.status !== "in_progress").length;
  const grades = GRADES.map((g) => ({
    id: g.id,
    label: g.label,
    waiting: students.filter((s) => s.grade === g.id && !s.slotStart && !byReg.has(s.id)).length,
  }));

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-ink p-6 text-white sm:p-10 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-amber-300">School dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{school.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-1 font-mono font-semibold">
              {school.code}
              <CopyButton value={school.code} label="Copy" className="text-white hover:bg-white/10" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {school.city}, {school.state}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/schools/dashboard/slips" className={btn("light", "sm")}>
            <Printer className="h-4 w-4" /> Print login slips
          </Link>
          <a href="/schools/dashboard/students.csv" className={btn("light", "sm")}>
            <Download className="h-4 w-4" /> Download CSV
          </a>
          <form action={schoolLogoutAction}>
            <button type="submit" className={btn("light", "sm")}>
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </div>

      {booked && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-5 w-5" /> Slot booked.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <IndianRupee className="h-5 w-5 text-indigo-600" />
            <Badge tone={school.paymentStatus === "verified" ? "emerald" : school.paymentStatus === "submitted" ? "amber" : school.paymentStatus === "rejected" ? "rose" : "slate"}>
              {school.paymentStatus === "verified" ? "Verified" : school.paymentStatus === "submitted" ? "Verifying" : school.paymentStatus === "rejected" ? "Action needed" : "Not paid"}
            </Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{rupees(school.feeAmount)}</p>
          <p className="text-xs text-ink/55">School fee · unlimited students</p>
          {!paid && (
            <Link href="/schools/dashboard/payment" className={cn(btn("primary", "sm"), "mt-3")}>
              <QrCode className="h-4 w-4" /> Pay now
            </Link>
          )}
          {school.paymentStatus === "rejected" && school.paymentNote && <p className="mt-2 text-xs text-rose-700">{school.paymentNote}</p>}
        </Card>
        {[
          { icon: Users, k: students.length, v: "students registered" },
          { icon: CalendarClock, k: `${withSlot} / ${students.length}`, v: "have an exam slot" },
          { icon: CheckCircle2, k: done, v: "exams completed" },
        ].map((x) => (
          <Card key={x.v} className="p-5">
            <x.icon className="h-5 w-5 text-indigo-600" />
            <p className="mt-3 font-display text-2xl font-bold">{x.k}</p>
            <p className="text-xs text-ink/55">{x.v}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6 sm:p-8">
          <p className="font-display text-xl font-bold">Add students</p>
          <p className="mt-1 text-sm text-ink/60">Each student gets a registration number and PIN to log in. Students need no email.</p>
          <details className="group mt-5 rounded-2xl ring-1 ring-ink/10" open>
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">Paste a class list (fastest)</summary>
            <div className="border-t border-ink/8 p-4">
              <BulkAddForm />
            </div>
          </details>
          <details className="mt-3 rounded-2xl ring-1 ring-ink/10">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">Add one student</summary>
            <div className="border-t border-ink/8 p-4">
              <AddStudentForm />
            </div>
          </details>
        </Card>
        <Card className="p-6 sm:p-8">
          <p className="font-display text-xl font-bold">Book exam slots</p>
          <p className="mt-1 text-sm text-ink/60">
            Book one slot for many students at once, e.g. a whole class in your computer lab. The exam opens only during the booked hour; you can change
            any student&apos;s slot from the list below.
          </p>
          <div className="mt-5">
            {paid ? (
              <BulkBookForm counts={counts} asOf={now} grades={grades} />
            ) : (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Submit the school payment first, then book slots.</p>
            )}
          </div>
          <Link href="/schedule" className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline">
            See the full December schedule →
          </Link>
        </Card>
      </div>

      <div className="mt-8 overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/8">
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <p className="font-display text-lg font-bold">Students</p>
          <span className="text-sm text-ink/55">{students.length}</span>
        </div>
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Login</th>
              <th className="px-5 py-3">Slot (IST)</th>
              <th className="px-5 py-3">Exam</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {students.map((s) => {
              const a = byReg.get(s.id);
              const slot = slotAt(s.slotStart);
              return (
                <tr key={s.id} className="align-middle">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{s.studentName}</p>
                    <p className="text-xs text-ink/50">{gradeLabel(s.grade)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-mono text-xs font-semibold">{s.regNo}</p>
                    <StudentPin pin={decryptPin(s.pinEnc)} />
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {slot ? (
                      <span>
                        {slotDay(slot.start)} · {slotTime(slot.start)}
                        {!a && paid && (
                          <Link href={`/schools/dashboard/slot?student=${s.id}`} className="ml-2 font-semibold text-indigo-600 hover:underline">
                            Change
                          </Link>
                        )}
                      </span>
                    ) : paid && !a ? (
                      <Link href={`/schools/dashboard/slot?student=${s.id}`} className="font-semibold text-indigo-600 hover:underline">
                        Book slot
                      </Link>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {!a ? (
                      <span className="text-ink/45">Not started</span>
                    ) : a.status === "in_progress" ? (
                      <Badge tone="amber">In progress</Badge>
                    ) : a.status === "disqualified" ? (
                      <Badge tone="rose">Disqualified</Badge>
                    ) : live && a.award ? (
                      <span className="font-semibold">
                        {AWARD_META[a.award].emoji} {AWARD_META[a.award].label} · {a.score}/{a.maxScore}
                        {a.award === "champion" && " · 🎁 wins a gift voucher"}
                      </span>
                    ) : (
                      <Badge tone="emerald">Submitted</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StudentActions id={s.id} name={s.studentName} canRemove={!a} />
                  </td>
                </tr>
              );
            })}
            {!students.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-ink/45">
                  No students yet. Paste your class list above to add them in one go.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
