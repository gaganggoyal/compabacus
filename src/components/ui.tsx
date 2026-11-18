import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "gold" | "ghost" | "outline" | "dark" | "danger" | "light";
type Size = "sm" | "md" | "lg";

export function btn(variant: Variant = "primary", size: Size = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";
  const sizes: Record<Size, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-[15px]",
    lg: "h-14 px-7 text-base",
  };
  const variants: Record<Variant, string> = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500",
    gold: "bg-gradient-to-b from-amber-300 to-amber-500 text-ink shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:to-amber-400",
    ghost: "text-ink hover:bg-ink/5",
    outline: "border border-ink/15 bg-white text-ink hover:border-ink/30 hover:bg-white",
    dark: "bg-ink text-white hover:bg-ink-2",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    light: "bg-white/10 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/15",
  };
  return cn(base, sizes[size], variants[variant]);
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl border border-ink/8 bg-white shadow-[0_1px_0_rgba(21,18,59,0.04),0_12px_40px_-20px_rgba(21,18,59,0.25)]", className)}
      {...props}
    />
  );
}

const tones = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
} as const;

export function Badge({ tone = "indigo", className, children }: { tone?: keyof typeof tones; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-bold uppercase tracking-[0.18em] text-indigo-600", className)}>{children}</p>
  );
}

export function SectionTitle({ eyebrow, title, sub, center, dark }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; center?: boolean; dark?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <Eyebrow className={dark ? "text-amber-300" : undefined}>{eyebrow}</Eyebrow>}
      <h2 className={cn("mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl", dark ? "text-white" : "text-ink")}>
        {title}
      </h2>
      {sub && <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-indigo-100/80" : "text-ink/65")}>{sub}</p>}
    </div>
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink/80">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink/50">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputCls =
  "block w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/35 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 aria-invalid:border-rose-400 aria-invalid:ring-rose-500/10";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-ink/[0.06]", className)} />;
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <p className="sr-only">{label}</p>
      </div>
    </div>
  );
}
