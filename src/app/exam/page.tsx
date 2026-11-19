import { ArrowLeft, BadgeCheck, CalendarClock, Clock, Lock, Monitor, Wifi, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { LiveExam, StartExamButton } from "@/components/exam/exam-client";
import { Card, btn, cn } from "@/components/ui";
import { currentStudent } from "@/lib/auth";
import { times } from "@/lib/config";
import { toClientPaper } from "@/lib/exam/generator";
import { gradeById, totalQuestions } from "@/lib/exam/papers";
import { parseAnswers, parsePaper } from "@/lib/exam/server";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { examGate, freshAttempt } from "@/lib/student-view";

export const metadata: Metadata = { title: "Exam", robots: { index: false } };

export default function ExamPage() {
  return (
    <div className="min-h-full bg-cream">
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          </div>
        }
      >
        <ExamGate />
      </Suspense>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Logo />
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>
      {children}
    </div>
  );
}

async function ExamGate() {
  const now = await requestNow();
  const reg = await currentStudent();
  if (!reg) redirect("/login?next=/exam");
  const attempt = await freshAttempt(reg, now);
  const gate = examGate(reg, attempt, now);
  const grade = gradeById(reg.grade)!;
  const paper = grade.paper;

  if (gate.kind === "in_progress" && attempt) {
    return (
      <LiveExam
        attemptId={attempt.id}
        paper={toClientPaper(parsePaper(attempt))}
        title={`${reg.studentName} · ${grade.label}`}
        subtitle={`${reg.regNo} · ${grade.label} paper`}
        deadline={attempt.deadlineAt.getTime()}
        serverNow={now}
        initialAnswers={parseAnswers(attempt)}
        initialFocusLosses={attempt.focusLosses}
      />
    );
  }

  if (gate.kind === "done" && attempt) {
    return (
      <Shell>
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <BadgeCheck className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold">
            {attempt.status === "disqualified" ? "Attempt closed" : "Paper submitted! 🎉"}
          </h1>
          {attempt.status !== "disqualified" ? (
            <>
              <p className="mt-3 text-ink/60">
                Great job, {reg.studentName.split(" ")[0]}! Your answers are safely recorded
                {attempt.timeTakenMs != null && <> — you finished in {fmtDuration(attempt.timeTakenMs)}</>}.
              </p>
              <p className="mt-6 rounded-2xl bg-ink px-5 py-4 text-white">
                Results & certificates: <b className="text-amber-300">{fmtDateTime(times.resultsAt)}</b>
              </p>
            </>
          ) : (
            <p className="mt-3 text-ink/60">{attempt.adminNote}</p>
          )}
          <Link href="/dashboard" className={cn(btn("primary"), "mt-8")}>
            Back to dashboard
          </Link>
        </Card>
      </Shell>
    );
  }

  if (gate.kind !== "open") {
    const msg =
      gate.kind === "pay"
        ? { t: "Payment needed", d: "Complete the ₹10 payment to unlock your exam.", href: "/dashboard/payment", cta: "Pay ₹10" }
        : gate.kind === "upcoming"
          ? { t: "The exam isn't open yet", d: `It opens on ${fmtDateTime(times.examStart)}. Practise with free mock tests until then!`, href: "/practice", cta: "Free mock test" }
          : { t: "The exam window has closed", d: "No attempt was recorded for this registration.", href: "/dashboard", cta: "Dashboard" };
    return (
      <Shell>
        <Card className="p-8 text-center sm:p-12">
          <Lock className="mx-auto h-10 w-10 text-ink/30" />
          <h1 className="mt-4 font-display text-2xl font-bold">{msg.t}</h1>
          <p className="mt-2 text-ink/60">{msg.d}</p>
          <Link href={msg.href} className={cn(btn("primary"), "mt-6")}>
            {msg.cta}
          </Link>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Championship exam</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Ready, {reg.studentName.split(" ")[0]}?</h1>
      <p className="mt-2 text-ink/60">
        {grade.label} paper · {grade.summary}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: Clock, k: `${paper.durationSec / 60} min`, v: "time limit" },
          { icon: CalendarClock, k: totalQuestions(paper), v: "questions" },
          { icon: Zap, k: paper.sections.length, v: "sections" },
        ].map((x) => (
          <div key={x.v} className="rounded-2xl bg-white p-4 text-center ring-1 ring-ink/8">
            <x.icon className="mx-auto h-5 w-5 text-indigo-600" />
            <p className="mt-2 font-display text-2xl font-bold">{x.k}</p>
            <p className="text-xs text-ink/50">{x.v}</p>
          </div>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <p className="font-display text-lg font-bold">Paper</p>
        <ul className="mt-3 divide-y divide-ink/8 text-sm">
          {paper.sections.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2.5">
              <span className="font-medium">{s.title}</span>
              <span className="text-ink/55">{s.count} questions</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <p className="font-display text-lg font-bold">Before you start</p>
        <ul className="mt-3 space-y-3 text-sm text-ink/70">
          <li className="flex gap-3">
            <Clock className="h-5 w-5 shrink-0 text-indigo-600" />
            The timer starts as soon as you press Start and cannot be paused. The paper submits automatically when time is up.
          </li>
          <li className="flex gap-3">
            <Monitor className="h-5 w-5 shrink-0 text-indigo-600" />
            Stay on this screen. Switching apps or tabs is recorded and may lead to disqualification.
          </li>
          <li className="flex gap-3">
            <Zap className="h-5 w-5 shrink-0 text-indigo-600" />
            Every question has four options — tap the right one. Each Flash Round question can be played only once; pick the total after the
            numbers finish.
          </li>
          <li className="flex gap-3">
            <Wifi className="h-5 w-5 shrink-0 text-indigo-600" />
            Answers save automatically every few seconds. If you get disconnected, log in again quickly.
          </li>
        </ul>
      </Card>

      <div className="mt-6">
        <StartExamButton />
      </div>
    </Shell>
  );
}
