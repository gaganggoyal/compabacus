import { ArrowLeft, Printer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand";
import { PrintButton } from "@/components/copy-button";
import { PageLoading, btn } from "@/components/ui";
import { currentStudent } from "@/lib/auth";
import { site, times } from "@/lib/config";
import { gradeById, totalQuestions } from "@/lib/exam/papers";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { slotAt, slotLabel } from "@/lib/slots";

export const metadata: Metadata = { title: "Admit card", robots: { index: false } };

export default function AdmitCardPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdmitCard />
    </Suspense>
  );
}

async function AdmitCard() {
  const reg = await currentStudent();
  if (!reg) redirect("/login?next=/dashboard/admit-card");
  const grade = gradeById(reg.grade);
  const slot = slotAt(reg.slotStart);
  const qr = await QRCode.toDataURL(`${site.url}/login`, { margin: 1, width: 240 });

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <PrintButton className={btn("dark", "sm")}>
            <Printer className="h-4 w-4" /> Print / save PDF
          </PrintButton>
        </div>
        <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/15 print:rounded-none print:ring-0">
          <header className="flex items-center justify-between bg-ink px-8 py-6 text-white print:bg-ink">
            <div className="flex items-center gap-3">
              <LogoMark className="h-11 w-11" />
              <div>
                <p className="font-display text-xl font-bold">{site.name}</p>
                <p className="text-xs text-indigo-100/70">Online · 1–31 December 2026</p>
              </div>
            </div>
            <p className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">Admit card</p>
          </header>
          <div className="grid gap-8 p-8 sm:grid-cols-[1fr_auto]">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Student name", reg.studentName],
                ["Registration no.", reg.regNo],
                ["Date of birth", fmtDate(reg.dob)],
                ["Class", grade?.label ?? reg.grade],
                ["Paper", `${grade ? totalQuestions(grade.paper) : "?"} multiple-choice questions · ${grade ? grade.paper.durationSec / 60 : "?"} min`],
                ["School / academy", reg.school ?? "—"],
                ["City", `${reg.city}, ${reg.state}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45">{k}</dt>
                  <dd className="mt-0.5 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code to the login page" className="mx-auto h-32 w-32" />
              <p className="mt-1 text-[10px] text-ink/50">Scan to log in</p>
            </div>
          </div>
          <div className="border-t border-dashed border-ink/15 px-8 py-6 text-sm">
            <p className="font-display font-bold">Exam slot</p>
            <p className="mt-1 text-ink/70">
              {slot ? (
                <>
                  <b className="text-ink">{slotLabel(slot)}</b>. Start the exam any time during this hour. One attempt; once started, the timer cannot be
                  paused.
                </>
              ) : (
                <>
                  Not booked yet: book a one-hour slot between {fmtDateTime(times.examStart)} and {fmtDateTime(times.examEnd)} (IST) from your dashboard.
                </>
              )}
            </p>
            <p className="mt-4 font-display font-bold">Instructions</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-ink/70">
              <li>Log in at {site.url.replace(/^https?:\/\//, "")}/login with your Registration No. and PIN.</li>
              <li>Use a laptop, tablet or phone with stable internet. Keep the device charged.</li>
              <li>Every question is multiple choice: tap one of four options. No negative marking.</li>
              <li>A physical abacus is allowed for written sections. The Flash Round must be done mentally.</li>
              <li>Calculators, other apps, and help from anyone are not allowed. Leaving the exam screen is recorded.</li>
              <li>Answers save automatically. If disconnected, log in again quickly — the timer keeps running.</li>
              <li>Results: {fmtDateTime(times.resultsAt)} on the website.</li>
            </ol>
          </div>
        </article>
      </div>
    </div>
  );
}
