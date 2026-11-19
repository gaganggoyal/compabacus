import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CalendarDays,
  Check,
  Clock,
  Download,
  Hourglass,
  IdCard,
  LogOut,
  Play,
  QrCode,
  Trophy,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { logoutAction } from "@/app/actions/student";
import { WhatsAppIcon, whatsappLink } from "@/components/brand";
import { CopyButton } from "@/components/copy-button";
import { Countdown } from "@/components/countdown";
import { Badge, Card, PageLoading, btn, cn } from "@/components/ui";
import { currentStudent } from "@/lib/auth";
import { times } from "@/lib/config";
import type { Attempt, Registration } from "@/lib/db/schema";
import { gradeById, totalQuestions } from "@/lib/exam/papers";
import { AWARD_META, fmtDate, fmtDateTime, fmtDuration } from "@/lib/format";
import { resultsLive } from "@/lib/results";
import { examGate, freshAttempt } from "@/lib/student-view";

export const metadata: Metadata = { title: "My dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const now = await requestNow();
  const reg = await currentStudent();
  if (!reg) redirect("/login?next=/dashboard");
  const attempt = await freshAttempt(reg, now);
  const live = await resultsLive(now);
  const gate = examGate(reg, attempt, now);
  const grade = gradeById(reg.grade);

  const steps = [
    { label: "Registered", done: true },
    { label: "Payment", done: reg.paymentStatus === "verified", partial: reg.paymentStatus === "submitted" },
    { label: "Exam", done: attempt?.status === "submitted" || attempt?.status === "disqualified", partial: attempt?.status === "in_progress" },
    { label: "Results", done: live },
  ];

  return (
    <div className="container-x py-10 sm:py-14">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 rounded-[2rem] bg-ink p-6 text-white sm:p-10 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-semibold text-amber-300">Student dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Hi, {reg.studentName.split(" ")[0]}! 👋</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-1 font-mono font-semibold">
              {reg.regNo}
              <CopyButton value={reg.regNo} label="Copy" className="text-white hover:bg-white/10" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">{grade?.label ?? reg.grade} paper</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admit-card" className={btn("light", "sm")}>
            <IdCard className="h-4 w-4" /> Admit card
          </Link>
          <Link href="/register" className={btn("light", "sm")}>
            <UserPlus className="h-4 w-4" /> Add another child
          </Link>
          <form action={logoutAction}>
            <button type="submit" className={btn("light", "sm")}>
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </div>

      {/* Progress */}
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="text-center">
            <div className={cn("h-1.5 rounded-full", s.done ? "bg-emerald-500" : s.partial ? "bg-amber-400" : "bg-ink/10")} />
            <p className={cn("mt-2 text-xs font-semibold sm:text-sm", s.done ? "text-emerald-700" : s.partial ? "text-amber-700" : "text-ink/40")}>
              {s.done && <Check className="mr-1 inline h-3.5 w-3.5" />}
              {i + 1}. {s.label}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {live && attempt && <ResultCard attempt={attempt} />}
          <ExamCard reg={reg} attempt={attempt} gate={gate.kind} live={live} />
          <PaymentCard reg={reg} />
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <Brain className="h-7 w-7 text-indigo-600" />
            <p className="mt-4 font-display text-xl font-bold">Free mock tests</p>
            <p className="mt-1 text-sm text-ink/60">
              Practise the {grade?.label} paper as many times as you like. A fresh paper every time.
            </p>
            <Link href={`/practice?class=${reg.grade}`} className={cn(btn("outline"), "mt-5")}>
              Start practising <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
          <Card className="p-6">
            <p className="font-display text-lg font-bold">Your details</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                ["Date of birth", fmtDate(reg.dob)],
                ["School", reg.school ?? "—"],
                ["Parent", reg.parentName],
                ["Mobile", reg.phone],
                ["City", `${reg.city}, ${reg.state}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink/50">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-ink/45">Spelling wrong? Message us before 31 Dec so your certificate is correct.</p>
          </Card>
          <a
            href={whatsappLink(`Hi, I need help. Registration number: ${reg.regNo}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-100 transition hover:bg-emerald-100/70"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white">
              <WhatsAppIcon />
            </span>
            <span>
              <span className="block font-bold text-emerald-900">Need help?</span>
              <span className="text-sm text-emerald-800/80">Chat with us on WhatsApp</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ reg }: { reg: Registration }) {
  const s = reg.paymentStatus;
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl font-bold">Payment · ₹10</p>
          <p className="mt-1 text-sm text-ink/60">
            {s === "verified" && "Payment received and verified. You're all set!"}
            {s === "submitted" && "We're verifying your UPI reference (usually within 24 hours). You can take the exam meanwhile."}
            {s === "unpaid" && "Pay ₹10 by UPI QR to confirm your registration and unlock the exam."}
            {s === "rejected" && (reg.paymentNote ?? "We couldn't verify your payment. Please check the UPI reference and submit again.")}
          </p>
          {reg.utr && <p className="mt-2 font-mono text-xs text-ink/50">UTR: {reg.utr}</p>}
        </div>
        <Badge tone={s === "verified" ? "emerald" : s === "submitted" ? "amber" : s === "rejected" ? "rose" : "slate"}>
          {s === "verified" ? "Verified" : s === "submitted" ? "Verifying" : s === "rejected" ? "Action needed" : "Pending"}
        </Badge>
      </div>
      {s !== "verified" && (
        <Link href="/dashboard/payment" className={cn(btn(s === "submitted" ? "outline" : "primary"), "mt-5")}>
          <QrCode className="h-4 w-4" /> {s === "submitted" ? "View / update payment" : "Pay ₹10 now"}
        </Link>
      )}
    </Card>
  );
}

function ExamCard({ reg, attempt, gate, live }: { reg: Registration; attempt: Attempt | undefined; gate: string; live: boolean }) {
  const grade = gradeById(reg.grade);
  const minutes = grade ? grade.paper.durationSec / 60 : 10;
  return (
    <Card className="relative overflow-hidden p-6 sm:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/60" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Championship exam</p>
        <p className="mt-2 font-display text-2xl font-bold">
          {grade?.label} paper · {grade ? totalQuestions(grade.paper) : "?"} questions · {minutes} minutes
        </p>

        {gate === "pay" && (
          <>
            <p className="mt-2 text-ink/60">Complete your ₹10 payment to unlock the exam.</p>
            <Link href="/dashboard/payment" className={cn(btn("primary", "lg"), "mt-6")}>
              <QrCode className="h-4 w-4" /> Pay ₹10
            </Link>
          </>
        )}
        {gate === "upcoming" && (
          <>
            <p className="mt-2 text-ink/60">
              The exam opens on <b>{fmtDateTime(times.examStart)}</b> and stays open until {fmtDateTime(times.examEnd)}. Take it any time in
              between — one attempt only.
            </p>
            <Countdown dark={false} className="mt-6" />
          </>
        )}
        {gate === "open" && (
          <>
            <p className="mt-2 text-ink/60">
              The exam is open! Find a quiet place, keep your abacus ready, and make sure you have {minutes + 5} free
              minutes. Exam closes {fmtDateTime(times.examEnd)}.
            </p>
            <Link href="/exam" className={cn(btn("primary", "lg"), "mt-6")}>
              <Play className="h-4 w-4" /> Go to exam
            </Link>
          </>
        )}
        {gate === "in_progress" && attempt && (
          <>
            <p className="mt-2 text-ink/60">
              Your exam is in progress. The timer is running — it ends at {fmtDateTime(attempt.deadlineAt)}.
            </p>
            <Link href="/exam" className={cn(btn("primary", "lg"), "mt-6")}>
              <Hourglass className="h-4 w-4" /> Resume exam
            </Link>
          </>
        )}
        {gate === "done" && attempt && (
          <div className="mt-4 flex flex-wrap gap-3">
            {attempt.status === "disqualified" ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                This attempt was disqualified: {attempt.adminNote ?? "unfair means"}. Contact us if you think this is a mistake.
              </p>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <BadgeCheck className="h-5 w-5" /> Submitted on {attempt.submittedAt ? fmtDateTime(attempt.submittedAt) : "—"}
                </span>
                {attempt.timeTakenMs != null && (
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-ink/5 px-4 py-3 text-sm font-semibold">
                    <Clock className="h-4 w-4" /> {fmtDuration(attempt.timeTakenMs)}
                  </span>
                )}
                {!live && (
                  <p className="w-full text-sm text-ink/60">
                    Well done! Scores, ranks and certificates are revealed on <b>{fmtDateTime(times.resultsAt)}</b>.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {gate === "missed" && <p className="mt-2 text-ink/60">The exam window has closed and no attempt was recorded.</p>}
      </div>
    </Card>
  );
}

function ResultCard({ attempt }: { attempt: Attempt }) {
  if (!attempt.award || attempt.status === "disqualified") {
    return (
      <Card className="p-6 sm:p-8">
        <p className="font-display text-xl font-bold">Results are out!</p>
        <p className="mt-2 text-ink/60">
          Your attempt isn&apos;t ranked — usually because the ₹10 payment wasn&apos;t verified. Please contact us on WhatsApp.
        </p>
      </Card>
    );
  }
  const meta = AWARD_META[attempt.award];
  const podium = attempt.award === "champion" || attempt.award === "runner_up_1" || attempt.award === "runner_up_2";
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] p-6 sm:p-8", podium ? "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-ink" : "bg-gradient-to-br from-indigo-600 to-violet-700 text-white")}>
      <Trophy className="absolute -right-6 -top-6 h-40 w-40 opacity-15" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Your result</p>
      <p className="mt-2 font-display text-4xl font-extrabold">
        {meta.emoji} {meta.label}
      </p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
        <span className="rounded-full bg-white/25 px-3 py-1">
          Score {attempt.score}/{attempt.maxScore}
        </span>
        <span className="rounded-full bg-white/25 px-3 py-1">Rank #{attempt.rank} in category</span>
        {attempt.timeTakenMs != null && <span className="rounded-full bg-white/25 px-3 py-1">{fmtDuration(attempt.timeTakenMs)}</span>}
      </div>
      {attempt.certNo && (
        <a href={`/certificate/${attempt.certNo}`} className={cn(btn(podium ? "dark" : "gold", "lg"), "mt-6")}>
          <Download className="h-4 w-4" /> Download certificate
        </a>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs opacity-75">
        <CalendarDays className="h-3.5 w-3.5" /> Certificate No. {attempt.certNo}
      </p>
    </div>
  );
}
