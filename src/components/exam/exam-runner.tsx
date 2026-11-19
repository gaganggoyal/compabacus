"use client";

import { Check, ChevronLeft, ChevronRight, Flag, LayoutGrid, Play, Send, TriangleExclamationPoint, Wifi, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/brand";
import { btn, cn } from "@/components/ui";
import type { Answers, ClientPaper, ClientQuestion } from "@/lib/exam/generator";
import { fmtClock } from "@/lib/format";

type SaveFn = (answers: Answers, focusLosses: number) => Promise<{ ok: boolean; serverNow: number; closed?: boolean; error?: string }>;

export type RunnerProps = {
  paper: ClientPaper;
  title: string;
  subtitle?: string;
  deadline: number;
  serverNow: number;
  initialAnswers?: Answers;
  initialFocusLosses?: number;
  storageKey: string;
  trackFocus?: boolean;
  onSave?: SaveFn;
  onSubmit: (answers: Answers, focusLosses: number) => Promise<void> | void;
};

type Item = { sectionIndex: number; q: ClientQuestion; n: number };

const LETTERS = "ABCD";
/** Pause after tapping an option before moving on, so the child sees their choice. */
const ADVANCE_MS = 350;

function readSet(key: string) {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set<string>();
  }
}

export function ExamRunner(props: RunnerProps) {
  const { paper, deadline, onSave, onSubmit, trackFocus = false, storageKey } = props;

  const items = useMemo<Item[]>(
    () => paper.sections.flatMap((s, si) => s.questions.map((q, qi) => ({ sectionIndex: si, q, n: qi + 1 }))),
    [paper],
  );

  const [answers, setAnswers] = useState<Answers>(props.initialAnswers ?? {});
  const [idx, setIdx] = useState(0);
  const [focusLosses, setFocusLosses] = useState(props.initialFocusLosses ?? 0);
  const [warn, setWarn] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline">("saved");
  // Flash questions already played (persisted, so a reload can't replay them) and ones whose numbers have finished.
  const [flashPlayed, setFlashPlayed] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : readSet(`flash:${storageKey}`),
  );
  const [flashDone, setFlashDone] = useState<Set<string>>(() => new Set(flashPlayed));

  // Difference between the server clock and this device's clock, measured on mount and on every save.
  const offset = useRef(0);
  useEffect(() => {
    offset.current = props.serverNow - Date.now();
  }, [props.serverNow]);
  const [now, setNow] = useState(() => props.serverNow);
  const dirty = useRef(false);
  const submitted = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  const lossesRef = useRef(focusLosses);
  useEffect(() => {
    answersRef.current = answers;
    lossesRef.current = focusLosses;
  }, [answers, focusLosses]);

  const remaining = deadline - now;
  const current = items[idx];
  const section = paper.sections[current.sectionIndex];
  const answeredCount = items.filter((it) => (answers[it.q.id] ?? "") !== "").length;

  const doSubmit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setConfirm(false);
    try {
      await onSubmit(answersRef.current, lossesRef.current);
    } catch {
      submitted.current = false;
      setSubmitting(false);
      setWarn("Could not submit — check your internet and press Submit again. Your answers are saved on this device.");
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, [onSubmit]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset.current), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0 && !submitted.current) void doSubmit();
  }, [remaining, doSubmit]);

  // Local backup of answers in case of crash/refresh
  useEffect(() => {
    try {
      localStorage.setItem(`answers:${storageKey}`, JSON.stringify(answers));
    } catch {}
  }, [answers, storageKey]);

  const save = useCallback(async () => {
    if (!onSave || !dirty.current || submitted.current) return;
    dirty.current = false;
    setSaveState("saving");
    try {
      const r = await onSave(answersRef.current, lossesRef.current);
      offset.current = r.serverNow - Date.now();
      if (r.closed) {
        submitted.current = true;
        window.location.reload();
        return;
      }
      setSaveState(r.ok ? "saved" : "offline");
      if (!r.ok) dirty.current = true;
    } catch {
      dirty.current = true;
      setSaveState("offline");
    }
  }, [onSave]);

  // Autosave
  useEffect(() => {
    if (!onSave) return;
    const t = setInterval(save, 8000);
    return () => clearInterval(t);
  }, [onSave, save]);

  // Focus tracking
  useEffect(() => {
    if (!trackFocus) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        if (submitted.current) return;
        setFocusLosses((n) => n + 1);
        dirty.current = true;
        void save();
      } else if (!submitted.current) {
        setWarn("You left the exam screen. This is recorded — please stay on this page until you submit.");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [trackFocus, save]);

  // Warn before closing the tab
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const go = useCallback(
    (i: number) => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setIdx(Math.max(0, Math.min(items.length - 1, i)));
      setPaletteOpen(false);
    },
    [items.length],
  );

  const choose = useCallback(
    (qid: string, option: number) => {
      setAnswers((a) => ({ ...a, [qid]: String(option) }));
      dirty.current = true;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      const from = items.findIndex((it) => it.q.id === qid);
      if (from < items.length - 1) {
        advanceTimer.current = setTimeout(() => setIdx((i) => (i === from ? from + 1 : i)), ADVANCE_MS);
      }
    },
    [items],
  );

  const markFlashPlayed = (id: string) => {
    setFlashPlayed((s) => {
      const n = new Set(s);
      n.add(id);
      try {
        localStorage.setItem(`flash:${storageKey}`, JSON.stringify([...n]));
      } catch {}
      return n;
    });
  };

  const markFlashDone = useCallback((id: string) => setFlashDone((s) => new Set(s).add(id)), []);

  // Keyboard: 1–4 or A–D picks an option, arrows / Enter move between questions.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirm || submitting || warn || e.metaKey || e.ctrlKey || e.altKey) return;
      const q = items[idx].q;
      const key = e.key.toLowerCase();
      const pick = "1234".includes(key) ? Number(key) - 1 : "abcd".includes(key) && key.length === 1 ? "abcd".indexOf(key) : -1;
      if (pick >= 0) {
        if (q.kind === "flash" && !flashDone.has(q.id)) return;
        e.preventDefault();
        choose(q.id, q.options[pick]);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        go(idx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, idx, confirm, submitting, warn, flashDone, choose, go]);

  const lowTime = remaining < 60_000;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cream select-none">
      {/* Top bar */}
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <LogoMark className="hidden h-8 w-8 sm:block" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-bold leading-tight">{props.title}</p>
            {props.subtitle && <p className="truncate text-xs text-ink/50">{props.subtitle}</p>}
          </div>
          {onSave && (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-ink/50 sm:flex">
              <Wifi className={cn("h-3.5 w-3.5", saveState === "offline" ? "text-rose-500" : "text-emerald-500")} />
              {saveState === "saving" ? "Saving…" : saveState === "offline" ? "Offline — retrying" : "Saved"}
            </span>
          )}
          <div
            className={cn(
              "rounded-2xl px-3.5 py-1.5 font-display text-2xl font-bold tabular-nums ring-1",
              lowTime ? "animate-pulse bg-rose-50 text-rose-600 ring-rose-200" : "bg-ink text-white ring-ink",
            )}
            role="timer"
            aria-label="Time remaining"
          >
            {fmtClock(remaining)}
          </div>
          <button type="button" onClick={() => setConfirm(true)} disabled={submitting} className={btn("primary", "sm")}>
            <Send className="h-4 w-4" /> Submit
          </button>
        </div>
        {/* Section tabs */}
        <div className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3">
          {paper.sections.map((s, si) => {
            const first = items.findIndex((it) => it.sectionIndex === si);
            const done = s.questions.filter((q) => (answers[q.id] ?? "") !== "").length;
            const active = si === current.sectionIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(first)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                  active ? "bg-indigo-600 text-white" : "bg-ink/5 text-ink/70 hover:bg-ink/10",
                )}
              >
                {s.kind === "flash" && <Zap className="h-3.5 w-3.5" />}
                {s.title}
                <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-white")}>
                  {done}/{s.questions.length}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6">
          <div className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-between text-sm font-semibold text-ink/50">
              <span>
                {section.title} · Q{current.n} of {section.questions.length}
              </span>
              <span className="tabular-nums">
                {idx + 1}/{items.length}
              </span>
            </div>
            <QuestionCard
              key={current.q.id}
              q={current.q}
              value={answers[current.q.id] ?? ""}
              onChoose={(o) => choose(current.q.id, o)}
              flashPlayed={flashPlayed.has(current.q.id)}
              onFlashPlayed={() => markFlashPlayed(current.q.id)}
              onFlashDone={() => markFlashDone(current.q.id)}
            />
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} className={btn("outline")}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button type="button" onClick={() => setPaletteOpen((o) => !o)} className={cn(btn("ghost"), "lg:hidden")}>
                <LayoutGrid className="h-4 w-4" /> All
              </button>
              {idx < items.length - 1 ? (
                <button type="button" onClick={() => go(idx + 1)} className={btn("dark")}>
                  {answers[current.q.id] ? "Next" : "Skip"} <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={() => setConfirm(true)} className={btn("primary")}>
                  <Flag className="h-4 w-4" /> Finish
                </button>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-ink/40">
              Tap an answer to move on. You can come back and change it until you submit.
              <span className="hidden sm:inline"> Keys 1–4 also work.</span>
            </p>
          </div>
        </main>

        {/* Palette */}
        <aside
          className={cn(
            "w-72 shrink-0 overflow-y-auto border-l border-ink/10 bg-white p-4",
            paletteOpen ? "fixed inset-x-0 bottom-0 top-auto z-10 max-h-[60vh] w-auto rounded-t-3xl border-t shadow-2xl" : "hidden lg:block",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Questions</p>
            <p className="text-xs font-semibold text-ink/50">
              {answeredCount}/{items.length} answered
            </p>
          </div>
          {paper.sections.map((s) => (
            <div key={s.id} className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink/40">{s.title}</p>
              <div className="grid grid-cols-7 gap-1.5">
                {s.questions.map((q, qi) => {
                  const gi = items.findIndex((it) => it.q.id === q.id);
                  const answered = (answers[q.id] ?? "") !== "";
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => go(gi)}
                      className={cn(
                        "h-8 rounded-lg text-xs font-bold tabular-nums transition",
                        gi === idx ? "ring-2 ring-indigo-600 ring-offset-1" : "",
                        answered ? "bg-indigo-600 text-white" : "bg-ink/5 text-ink/60 hover:bg-ink/10",
                      )}
                      aria-label={`${s.title} question ${qi + 1}${answered ? ", answered" : ""}`}
                    >
                      {qi + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setConfirm(true)} className={cn(btn("primary"), "mt-2 w-full")}>
            <Send className="h-4 w-4" /> Submit paper
          </button>
        </aside>
      </div>

      {/* Warning toast */}
      {warn && (
        <div className="fixed inset-x-0 top-24 z-[60] mx-auto w-[min(92vw,30rem)] rounded-2xl bg-ink p-4 text-white shadow-2xl" role="alert">
          <div className="flex gap-3">
            <TriangleExclamationPoint className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm">{warn}</p>
          </div>
          <button type="button" onClick={() => setWarn(null)} className={cn(btn("gold", "sm"), "mt-3 w-full")}>
            OK, continue
          </button>
        </div>
      )}

      {/* Confirm submit */}
      {(confirm || submitting) && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            {submitting ? (
              <>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <p className="mt-4 font-display text-lg font-bold">Submitting your paper…</p>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-bold">Submit your paper?</p>
                <p className="mt-2 text-ink/60">
                  You&apos;ve answered <b className="text-ink">{answeredCount}</b> of {items.length} questions.
                  {answeredCount < items.length && " Unanswered questions get zero."} You can&apos;t change answers after submitting.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setConfirm(false)} className={btn("outline")}>
                    Keep working
                  </button>
                  <button type="button" onClick={doSubmit} className={btn("primary")}>
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Num({ n }: { n: number }) {
  return n < 0 ? <span className="text-rose-600">−{Math.abs(n)}</span> : <span>{n}</span>;
}

function OptionGrid({ options, value, onChoose }: { options: number[]; value: string; onChoose: (o: number) => void }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Answer options">
      {options.map((o, i) => {
        const selected = value === String(o);
        const long = String(o).length >= 6;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Option ${LETTERS[i]}: ${o}`}
            onClick={() => onChoose(o)}
            className={cn(
              "relative rounded-2xl border-2 px-3 pb-3 pt-6 text-center transition active:scale-[0.97]",
              selected
                ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "border-ink/10 bg-white text-ink hover:border-indigo-300 hover:bg-indigo-50/60",
            )}
          >
            <span
              className={cn(
                "absolute left-2 top-2 grid h-5 min-w-5 place-items-center rounded-md px-1 text-[11px] font-bold",
                selected ? "bg-white/20 text-white" : "bg-ink/5 text-ink/50",
              )}
            >
              {LETTERS[i]}
            </span>
            {selected && <Check className="absolute right-2 top-2 h-4 w-4" />}
            <span className={cn("block font-display font-bold tabular-nums", long ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuestionCard({
  q,
  value,
  onChoose,
  flashPlayed,
  onFlashPlayed,
  onFlashDone,
}: {
  q: ClientQuestion;
  value: string;
  onChoose: (o: number) => void;
  flashPlayed: boolean;
  onFlashPlayed: () => void;
  onFlashDone: () => void;
}) {
  if (q.kind === "flash") {
    return <FlashCard q={q} value={value} onChoose={onChoose} played={flashPlayed} onPlayed={onFlashPlayed} onDone={onFlashDone} />;
  }
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_20px_60px_-30px_rgba(21,18,59,0.35)] ring-1 ring-ink/8 sm:p-8">
      {q.kind === "addsub" ? (
        <div className="mx-auto w-fit min-w-[8rem] text-right font-display text-4xl font-bold leading-[1.25] tabular-nums sm:text-5xl">
          {q.rows.map((r, i) => (
            <div key={i}>
              <Num n={r} />
            </div>
          ))}
          <div className="mt-2 border-t-[3px] border-ink" />
        </div>
      ) : (
        <div className="text-center font-display text-4xl font-bold tabular-nums sm:text-5xl">
          {q.a} <span className="text-indigo-600">{q.kind === "mul" ? "×" : "÷"}</span> {q.b} <span className="text-ink/30">=</span>
        </div>
      )}
      <OptionGrid options={q.options} value={value} onChoose={onChoose} />
    </div>
  );
}

function FlashCard({
  q,
  value,
  onChoose,
  played,
  onPlayed,
  onDone,
}: {
  q: Extract<ClientQuestion, { kind: "flash" }>;
  value: string;
  onChoose: (o: number) => void;
  played: boolean;
  onPlayed: () => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<"idle" | "countdown" | "playing" | "done">(played ? "done" : "idle");
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(3);
  // The parent re-renders 4×/s for the clock; keep the callback in a ref so the flash timer isn't reset each time.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (stage === "countdown") {
      const t = setTimeout(() => {
        if (count <= 1) {
          setStep(0);
          setStage("playing");
        } else setCount((c) => c - 1);
      }, 650);
      return () => clearTimeout(t);
    }
    if (stage === "playing") {
      const t = setTimeout(() => {
        if (step + 1 >= q.rows.length) {
          setStage("done");
          onDoneRef.current();
        } else setStep((s) => s + 1);
      }, q.intervalMs);
      return () => clearTimeout(t);
    }
  }, [stage, step, count, q.rows.length, q.intervalMs]);

  return (
    <div className="overflow-hidden rounded-3xl bg-ink p-5 text-white shadow-2xl ring-1 ring-white/10 sm:p-8">
      <div className="grid min-h-[11rem] place-items-center">
        {stage === "idle" && (
          <div className="text-center">
            <Zap className="mx-auto h-8 w-8 text-amber-300" />
            <p className="mt-3 font-display text-xl font-bold">Flash round</p>
            <p className="mt-1 text-sm text-indigo-100/70">
              {q.rows.length} numbers will flash, one every {(q.intervalMs / 1000).toFixed(1)}s. Add them in your head, then pick the total.
              <br />
              <b className="text-amber-200">You can play it only once.</b>
            </p>
            <button
              type="button"
              onClick={() => {
                onPlayed();
                setCount(3);
                setStage("countdown");
              }}
              className={cn(btn("gold"), "mt-5")}
            >
              <Play className="h-4 w-4" /> Start flash
            </button>
          </div>
        )}
        {stage === "countdown" && <p className="font-display text-6xl font-extrabold text-amber-300">{count}</p>}
        {stage === "playing" && (
          <div className="text-center">
            <p key={step} className="animate-flash-in font-display text-8xl font-extrabold tabular-nums">
              {q.rows[step]}
            </p>
            <div className="mt-6 flex justify-center gap-1.5">
              {q.rows.map((_, i) => (
                <span key={i} className={cn("h-1.5 w-6 rounded-full", i <= step ? "bg-amber-300" : "bg-white/15")} />
              ))}
            </div>
          </div>
        )}
        {stage === "done" && (
          <div className="text-center">
            <p className="font-display text-2xl font-bold">What&apos;s the total?</p>
            <p className="mt-1 text-sm text-indigo-100/60">{q.rows.length} numbers were flashed</p>
          </div>
        )}
      </div>
      {stage === "done" && <OptionGrid options={q.options} value={value} onChoose={onChoose} />}
    </div>
  );
}
