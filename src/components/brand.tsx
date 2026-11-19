import { site } from "@/lib/config";
import { cn } from "./ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#15123b" />
      <path d="M13 12.5h-2.6a3 3 0 0 0 0 6h3.2M27 12.5h2.6a3 3 0 0 1 0 6h-3.2" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <path d="M12.5 10h15v6.5a7.5 7.5 0 0 1-15 0z" fill="#f59e0b" />
      <path d="M18.5 23.5h3V27h-3z" fill="#f59e0b" />
      <rect x="14.5" y="27" width="11" height="3.2" rx="1.2" fill="#fbbf24" />
      <path d="M15.6 12.6v3.6" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M31.5 3.6l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="#fde68a" />
    </svg>
  );
}

export function Logo({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block font-display text-[17px] font-bold tracking-tight", dark ? "text-white" : "text-ink")}>
          {site.shortName}
        </span>
        <span className={cn("block whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em]", dark ? "text-amber-300" : "text-indigo-600")}>
          {site.eventShort}
        </span>
      </span>
    </span>
  );
}

const ROWS = [
  { beads: ["#f59e0b", "#f59e0b", "#f59e0b"], slide: 46, delay: "0s" },
  { beads: ["#818cf8", "#818cf8", "#818cf8", "#818cf8"], slide: 34, delay: "0.6s" },
  { beads: ["#f43f5e", "#f43f5e"], slide: 58, delay: "1.2s" },
  { beads: ["#34d399", "#34d399", "#34d399"], slide: 40, delay: "1.8s" },
  { beads: ["#38bdf8", "#38bdf8", "#38bdf8", "#38bdf8"], slide: 30, delay: "2.4s" },
];

/** Animated abacus illustration for the hero. Pure CSS animation, no JS. */
export function AbacusArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className="relative rounded-[2.2rem] bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <div className="rounded-[1.6rem] bg-gradient-to-b from-[#1d1850] to-[#120f33] px-5 py-6 ring-1 ring-black/40 sm:px-7">
          <div className="space-y-5">
            {ROWS.map((row, i) => (
              <div key={i} className="relative flex h-9 items-center">
                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-200/70 via-amber-100/90 to-amber-200/70" />
                <div
                  className="relative flex animate-bead gap-[3px]"
                  style={{ ["--slide" as string]: `${row.slide}px`, animationDelay: row.delay }}
                >
                  {row.beads.map((c, j) => (
                    <span
                      key={j}
                      className="block h-9 w-11 rounded-[50%] shadow-[inset_-4px_-6px_10px_rgba(0,0,0,0.35),inset_4px_5px_8px_rgba(255,255,255,0.35)]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="relative ml-auto flex gap-[3px] opacity-90">
                  {Array.from({ length: 5 - row.beads.length + 1 }).map((_, j) => (
                    <span
                      key={j}
                      className="block h-9 w-11 rounded-[50%] bg-white/85 shadow-[inset_-4px_-6px_10px_rgba(0,0,0,0.25),inset_4px_5px_8px_rgba(255,255,255,0.6)]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -top-6 right-0 animate-float sm:-right-4 rounded-2xl bg-white px-4 py-3 shadow-xl [--r:6deg]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/50">Flash round</p>
        <p className="font-display text-3xl font-extrabold text-indigo-600 tabular-nums">+ 47</p>
      </div>
      <div
        className="absolute -bottom-7 left-0 animate-float sm:-left-5 rounded-2xl bg-ink px-4 py-3 text-white shadow-xl ring-1 ring-white/10 [--r:-5deg]"
        style={{ animationDelay: "1.5s" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Champion</p>
        <p className="font-display text-xl font-bold">60 / 60 · 7m 12s</p>
      </div>
    </div>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

export function whatsappLink(text = `Hi! I have a question about the ${site.name}.`) {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}
