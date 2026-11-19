import { ArrowLeft, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";
import { LogoMark } from "@/components/brand";
import { PrintButton } from "@/components/copy-button";
import { PageLoading, btn } from "@/components/ui";
import { currentSchool } from "@/lib/auth";
import { site } from "@/lib/config";
import { decryptPin } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { GRADES, gradeLabel } from "@/lib/exam/papers";
import { slotAt, slotDay, slotHours } from "@/lib/slots";

export const metadata: Metadata = { title: "Login slips", robots: { index: false } };

const ORDER = new Map(GRADES.map((g, i) => [g.id, i]));

export default function SlipsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Slips />
    </Suspense>
  );
}

async function Slips() {
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  const students = (
    await db.select().from(schema.registrations).where(eq(schema.registrations.schoolId, school.id)).orderBy(asc(schema.registrations.studentName))
  ).sort((a, b) => (ORDER.get(a.grade) ?? 99) - (ORDER.get(b.grade) ?? 99));
  const host = site.url.replace(/^https?:\/\//, "");

  return (
    <div className="container-x py-8 print:max-w-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/schools/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> School dashboard
        </Link>
        <PrintButton className={btn("primary", "sm")}>
          <Printer className="h-4 w-4" /> Print {students.length} slips
        </PrintButton>
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold print:hidden">Login slips · {school.name}</h1>
      <p className="mt-1 text-sm text-ink/55 print:hidden">Cut along the dotted lines and hand each student their slip. Keep PINs private.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 print:mt-0 print:grid-cols-2 print:gap-0">
        {students.map((s) => {
          const slot = slotAt(s.slotStart);
          return (
            <div key={s.id} className="break-inside-avoid rounded-2xl border-2 border-dashed border-ink/20 bg-white p-4 print:rounded-none print:border-ink/40">
              <div className="flex items-center gap-2">
                <LogoMark className="h-7 w-7" />
                <p className="text-xs font-bold uppercase tracking-wider text-ink/60">{site.name}</p>
              </div>
              <p className="mt-2 font-display text-lg font-bold leading-tight">{s.studentName}</p>
              <p className="text-xs text-ink/60">
                {gradeLabel(s.grade)} · {school.name}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-ink/[0.04] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-ink/50">Registration no.</p>
                  <p className="font-mono font-bold">{s.regNo}</p>
                </div>
                <div className="rounded-lg bg-ink/[0.04] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-ink/50">PIN</p>
                  <p className="font-mono font-bold">{decryptPin(s.pinEnc) ?? "ask teacher"}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-ink/70">
                <b>Exam slot:</b> {slot ? `${slotDay(slot.start)}, ${slotHours(slot)} IST` : "to be booked"}
              </p>
              <p className="mt-1 text-xs text-ink/70">
                <b>Log in at:</b> {host}/login
              </p>
            </div>
          );
        })}
      </div>
      {!students.length && <p className="mt-10 text-center text-ink/50">No students yet.</p>}
    </div>
  );
}
