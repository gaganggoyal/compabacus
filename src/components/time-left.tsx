"use client";

import { useNow } from "./offer-countdown";
import { cn } from "./ui";

/** "Starts in 3d 04h 12m" style countdown to a fixed time. */
export function TimeLeft({ target, label, className }: { target: number; label: string; className?: string }) {
  const now = useNow();
  const diff = Math.max(0, target - (now ?? target));
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff / 3_600_000) % 24);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const text = now === null ? "…" : d ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m` : `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return (
    <p className={cn("text-sm font-semibold text-ink/60", className)}>
      {label} <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 font-mono tabular-nums text-ink" suppressHydrationWarning>{text}</span>
    </p>
  );
}
