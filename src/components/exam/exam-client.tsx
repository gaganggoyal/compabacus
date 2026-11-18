"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProgressAction, startExamAction, submitExamAction } from "@/app/actions/exam";
import { btn, cn } from "@/components/ui";
import type { Answers, ClientPaper } from "@/lib/exam/generator";
import { ExamRunner } from "./exam-runner";

export function StartExamButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  return (
    <div>
      <label className="flex gap-3 rounded-2xl bg-indigo-50 p-4 text-sm text-ink/80 ring-1 ring-indigo-100">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" />
        I will take this exam on my own, without a calculator or anyone&apos;s help, and I understand I get only one attempt.
      </label>
      {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
      <button
        type="button"
        disabled={!agreed || pending}
        onClick={() => {
          setError(null);
          document.documentElement.requestFullscreen?.().catch(() => {});
          start(async () => {
            const r = await startExamAction();
            if (r.error) setError(r.error);
            else router.refresh();
          });
        }}
        className={cn(btn("primary", "lg"), "mt-5 w-full")}
      >
        <Play className="h-4 w-4" /> {pending ? "Preparing your paper…" : "Start exam now"}
      </button>
    </div>
  );
}

export function LiveExam(props: {
  attemptId: string;
  paper: ClientPaper;
  title: string;
  subtitle: string;
  deadline: number;
  serverNow: number;
  initialAnswers: Answers;
  initialFocusLosses: number;
}) {
  const router = useRouter();
  return (
    <ExamRunner
      paper={props.paper}
      title={props.title}
      subtitle={props.subtitle}
      deadline={props.deadline}
      serverNow={props.serverNow}
      initialAnswers={props.initialAnswers}
      initialFocusLosses={props.initialFocusLosses}
      storageKey={props.attemptId}
      trackFocus
      onSave={(answers, losses) => saveProgressAction(props.attemptId, answers, losses)}
      onSubmit={async (answers, losses) => {
        let lastError: unknown;
        for (let i = 0; i < 4; i++) {
          try {
            const r = await submitExamAction(props.attemptId, answers, losses);
            if (r.error) throw new Error(r.error);
            router.refresh();
            return;
          } catch (e) {
            lastError = e;
            await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
          }
        }
        throw lastError;
      }}
    />
  );
}
