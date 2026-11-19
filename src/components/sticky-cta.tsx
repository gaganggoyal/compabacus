"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pricing } from "@/lib/config";
import { OFFER_END_LABEL, rupees } from "@/lib/pricing";
import { useOfferLive } from "./offer-countdown";
import { btn, cn } from "./ui";

/** Phone-only "Register" bar that slides up once the hero has scrolled away. */
export function StickyCta() {
  const [show, setShow] = useState(false);
  const live = useOfferLive();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const p = pricing.individual;
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(21,18,59,0.12)] backdrop-blur transition-transform duration-300 lg:hidden print:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">{live ? `Launch offer · ends ${OFFER_END_LABEL}` : "Registrations open"}</p>
          <p className="font-display text-xl font-extrabold">
            {live && <s className="mr-1.5 text-sm font-bold text-ink/40 decoration-rose-500/70">{rupees(p.regular)}</s>}
            {rupees(live ? p.offer : p.regular)}
            <span className="text-xs font-semibold text-ink/50"> per child</span>
          </p>
        </div>
        <Link href="/register" className={btn("gold", "md")} tabIndex={show ? 0 : -1}>
          Register now
        </Link>
      </div>
    </div>
  );
}
