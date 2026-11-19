import { Tag } from "lucide-react";
import { pricing } from "@/lib/config";
import { OFFER_END_LABEL, type Plan, rupees, savingPercent } from "@/lib/pricing";
import { cn } from "./ui";

const SIZES = {
  sm: { now: "text-lg", was: "text-sm" },
  md: { now: "text-3xl", was: "text-lg" },
  lg: { now: "text-5xl sm:text-6xl", was: "text-xl sm:text-2xl" },
} as const;

/** "₹499 ₹10": the regular price struck through next to the launch-offer price. */
export function PriceTag({
  plan,
  offerLive,
  size = "md",
  dark,
  className,
}: {
  plan: Plan;
  offerLive: boolean;
  size?: keyof typeof SIZES;
  dark?: boolean;
  className?: string;
}) {
  const p = pricing[plan];
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      {offerLive && (
        <s className={cn("font-display font-bold decoration-2", s.was, dark ? "text-white/45 decoration-rose-400/80" : "text-ink/40 decoration-rose-500/70")}>
          <span className="sr-only">Regular price </span>
          {rupees(p.regular)}
        </s>
      )}
      <span className={cn("font-display font-extrabold tracking-tight", s.now, dark ? "text-white" : "text-ink")}>
        {offerLive && <span className="sr-only">Launch offer price </span>}
        {rupees(offerLive ? p.offer : p.regular)}
      </span>
    </span>
  );
}

/** "Launch offer · 98% off · ends 25 Dec" */
export function OfferBadge({ plan, offerLive, dark, className }: { plan: Plan; offerLive: boolean; dark?: boolean; className?: string }) {
  if (!offerLive) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
        dark ? "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30" : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
        className,
      )}
    >
      <Tag className="h-3.5 w-3.5" /> Launch offer · {savingPercent(plan)}% off · ends {OFFER_END_LABEL}
    </span>
  );
}
