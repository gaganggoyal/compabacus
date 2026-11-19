"use client";

import { useEffect, useState } from "react";
import { pricing } from "@/lib/config";
import { OFFER_END, offerLive, rupees } from "@/lib/pricing";
import { cn } from "./ui";

/** Ticks once a second after mount; null during server render so the HTML never depends on the clock. */
export function useNow(intervalMs = 1000) {
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

/** Whether the launch offer is still on, checked in the browser (assumes it is until the clock is known). */
export function useOfferLive() {
  const now = useNow(60_000);
  return now === null ? true : offerLive(now);
}

/** "₹10" or "₹499", for buttons in client components. */
export function useIndividualPrice() {
  return rupees(useOfferLive() ? pricing.individual.offer : pricing.individual.regular);
}

/** "Offer ends in 36d 04h 12m 09s". Disappears once the offer is over. */
export function OfferCountdown({ dark, className, label = "Launch offer ends in" }: { dark?: boolean; className?: string; label?: string }) {
  const now = useNow();
  if (now !== null && !offerLive(now)) return null;
  const diff = Math.max(0, OFFER_END - (now ?? OFFER_END));
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: "d" },
    { v: Math.floor((diff / 3_600_000) % 24), l: "h" },
    { v: Math.floor((diff / 60_000) % 60), l: "m" },
    { v: Math.floor((diff / 1000) % 60), l: "s" },
  ];
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold", dark ? "text-indigo-100/80" : "text-ink/60", className)}>
      <span>{label}</span>
      <span className="inline-flex gap-1" aria-live="off">
        {parts.map((p) => (
          <span
            key={p.l}
            className={cn("rounded-md px-1.5 py-0.5 font-mono text-[13px] tabular-nums", dark ? "bg-white/10 text-white" : "bg-ink/[0.06] text-ink")}
            suppressHydrationWarning
          >
            {now === null ? "--" : String(p.v).padStart(2, "0")}
            {p.l}
          </span>
        ))}
      </span>
    </p>
  );
}
