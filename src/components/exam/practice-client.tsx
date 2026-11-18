"use client";

import { Check, Clock, RotateCcw, Timer, X, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, btn, cn } from "@/components/ui";
import { type Answers, type Paper, generatePaper, normaliseAnswer, scorePaper, toClientPaper } from "@/lib/exam/generator";
import { LEVELS, type LevelSpec, quickVersion, totalQuestions } from "@/lib/exam/levels";
import { fmtDuration } from "@/lib/format";
import { ExamRunner } from "./exam-runner";

type Run = { paper: Paper; level: LevelSpec; startedAt: number; deadline: number; key: string };
type Done = Run & { answers: Answers; finishedAt: number };

function newRun(spec: LevelSpec): Run {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const now = Date.now();
  return { paper: generatePaper(spec, seed), level: spec, startedAt: now, deadline: now + spec.durationSec * 1000, key: `practice-${seed}` };
}

function finish(run: Run, answers: Answers): Done {
  return { ...run, answers, finishedAt: Math.min(Date.now(), run.deadline) };
}

export function PracticeClient() {
  const [levelId, setLevelId] = useState(LEVELS[1].id);
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const base = LEVELS.find((l) => l.id === levelId)!;
  const spec = mode === "quick" ? quickVersion(base) : base;

  const start = () => {
    setDone(null);
    setRun(newRun(spec));
  };

  if (run) {
    return (
      <ExamRunner
        key={run.key}
        paper={toClientPaper(run.paper)}
        title={`Mock test · ${base.name}`}
        subtitle={mode === "quick" ? "Quick practice" : "Full-length mock"}
        deadline={run.deadline}
        serverNow={run.startedAt}
        storageKey={run.key}
        onSubmit={(answers) => {
          setDone(finish(run, answers));
          setRun(null);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (done) return <PracticeResult done={done} levelName={base.name} onRetry={start} onChange={() => setDone(null)} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <p className="text-sm font-bold text-ink/70">1. Choose a level</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLevelId(l.id)}
              className={cn(
                "rounded-2xl bg-white p-4 text-left ring-1 transition",
                l.id === levelId ? "ring-2 ring-indigo-600 shadow-lg shadow-indigo-600/10" : "ring-ink/10 hover:ring-ink/25",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold">{l.name}</span>
                <Badge tone={l.id === levelId ? "indigo" : "slate"}>{l.id}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink/60">{l.short}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-ink p-6 text-white sm:p-8">
          <p className="text-sm font-bold text-indigo-100/70">2. Pick a test length</p>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1.5">
            {(["quick", "full"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn("rounded-xl px-3 py-2.5 text-sm font-bold transition", mode === m ? "bg-white text-ink" : "text-white/70 hover:text-white")}
              >
                {m === "quick" ? "Quick practice" : "Full mock"}
              </button>
            ))}
          </div>
          <p className="mt-6 font-display text-2xl font-bold">{base.name}</p>
          <p className="mt-1 text-sm text-indigo-100/70">{base.description}</p>
          <ul className="mt-5 space-y-2 text-sm">
            {spec.sections.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="flex items-center gap-2">
                  {s.kind === "flash" && <Zap className="h-3.5 w-3.5 text-amber-300" />}
                  {s.title}
                </span>
                <span className="font-semibold tabular-nums">{s.count} Q</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-4 text-sm text-indigo-100/80">
            <span className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" /> {Math.round(spec.durationSec / 60)} min
            </span>
            <span>{totalQuestions(spec)} questions</span>
          </div>
          <button type="button" onClick={start} className={cn(btn("gold", "lg"), "mt-6 w-full")}>
            Start mock test
          </button>
          <p className="mt-3 text-center text-xs text-indigo-100/50">Free & unlimited · nothing is saved</p>
        </div>
      </div>
    </div>
  );
}

function PracticeResult({ done, levelName, onRetry, onChange }: { done: Done; levelName: string; onRetry: () => void; onChange: () => void }) {
  const { score, max, bySection } = scorePaper(done.paper, done.answers);
  const pct = max ? Math.round((score / max) * 100) : 0;
  const message =
    pct >= 90 ? "Outstanding! You're Champion material." : pct >= 75 ? "Great work — Merit level!" : pct >= 50 ? "Good effort. A bit more practice and you'll fly." : "Keep practising — or try an easier level.";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl bg-ink p-8 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Mock test · {levelName}</p>
        <p className="mt-4 font-display text-6xl font-extrabold tabular-nums">
          {score}
          <span className="text-3xl text-white/40">/{max}</span>
        </p>
        <p className="mt-2 text-lg text-indigo-100/80">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">{pct}% accuracy</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <Clock className="h-3.5 w-3.5" /> {fmtDuration(done.finishedAt - done.startedAt)}
          </span>
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onRetry} className={btn("gold")}>
            <RotateCcw className="h-4 w-4" /> New test, same level
          </button>
          <button type="button" onClick={onChange} className={btn("light")}>
            Change level
          </button>
          <Link href="/register" className={btn("light")}>
            Register for the real exam · ₹10
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {done.paper.sections.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/45">{s.title}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">
              {bySection[s.id].correct}/{bySection[s.id].total}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-bold">Answer review</h2>
      <div className="mt-4 divide-y divide-ink/8 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8">
        {done.paper.sections.flatMap((s) =>
          s.questions.map((q, i) => {
            const given = done.answers[q.id] ?? "";
            const ok = normaliseAnswer(given) === q.answer;
            const text =
              q.kind === "mul"
                ? `${q.a} × ${q.b}`
                : q.kind === "div"
                  ? `${q.a} ÷ ${q.b}`
                  : q.rows.map((r, j) => (j === 0 ? `${r}` : r < 0 ? ` − ${-r}` : ` + ${r}`)).join("");
            return (
              <div key={q.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full", ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                  {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </span>
                <span className="w-14 shrink-0 text-xs font-semibold text-ink/40">
                  {s.title.split(" ")[0]} {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-ink/80">{text}</span>
                <span className="shrink-0 tabular-nums">
                  {!ok && <span className="mr-2 text-rose-600 line-through">{given || "—"}</span>}
                  <b>{q.answer}</b>
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
