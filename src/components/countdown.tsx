"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Phase, phaseAt, times } from "@/lib/config";
import { btn, cn } from "./ui";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [intervalMs]);
  return now;
}

const COPY: Record<Phase, { label: string; target: number }> = {
  upcoming: { label: "Exam window opens in", target: times.examStart },
  live: { label: "Exam window closes in", target: times.examEnd },
  closed: { label: "Winners announced in", target: times.resultsAt },
  results: { label: "Results are live!", target: times.resultsAt },
};

export function Countdown({ dark = true, className }: { dark?: boolean; className?: string }) {
  const now = useNow();
  const phase = now ? phaseAt(now) : "upcoming";
  const { label, target } = COPY[phase];
  const diff = Math.max(0, target - (now ?? target));
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: "days" },
    { v: Math.floor((diff / 3_600_000) % 24), l: "hrs" },
    { v: Math.floor((diff / 60_000) % 60), l: "min" },
    { v: Math.floor((diff / 1000) % 60), l: "sec" },
  ];

  return (
    <div className={className}>
      <p className={cn("text-xs font-bold uppercase tracking-[0.18em]", dark ? "text-amber-300" : "text-indigo-600")}>{label}</p>
      {phase === "results" ? (
        <Link href="/results" className={cn(btn("gold", "md"), "mt-3")}>
          See the winners →
        </Link>
      ) : (
        <div className="mt-3 flex gap-2.5" aria-live="off">
          {parts.map((p) => (
            <div
              key={p.l}
              className={cn(
                "min-w-[4.2rem] rounded-2xl px-3 py-2.5 text-center",
                dark ? "bg-white/[0.07] ring-1 ring-white/10" : "bg-white ring-1 ring-ink/10",
              )}
            >
              <div className={cn("font-display text-3xl font-bold tabular-nums", dark ? "text-white" : "text-ink")} suppressHydrationWarning>
                {now === null ? "--" : p.v.toString().padStart(2, "0")}
              </div>
              <div className={cn("text-[10px] font-bold uppercase tracking-widest", dark ? "text-indigo-200/60" : "text-ink/50")}>{p.l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PhaseCta() {
  const now = useNow(30_000);
  const phase = now ? phaseAt(now) : "upcoming";
  if (phase === "results")
    return (
      <Link href="/results" className={btn("gold", "lg")}>
        View results
      </Link>
    );
  if (phase === "closed")
    return (
      <Link href="/dashboard" className={btn("gold", "lg")}>
        Go to my dashboard
      </Link>
    );
  return (
    <Link href="/register" className={btn("gold", "lg")}>
      Register now · only ₹10
    </Link>
  );
}
