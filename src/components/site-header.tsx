"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./brand";
import { useIndividualPrice } from "./offer-countdown";
import { btn, cn } from "./ui";

const NAV = [
  { href: "/#format", label: "Exam format" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/schedule", label: "Slots" },
  { href: "/schools", label: "Schools" },
  { href: "/practice", label: "Free practice" },
  { href: "/results", label: "Results" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const price = useIndividualPrice();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = onHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300 print:hidden",
        dark ? "bg-ink" : "border-b border-ink/8 bg-cream/85 backdrop-blur-xl",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Home">
          <Logo dark={dark} />
        </Link>
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-semibold transition",
                dark ? "text-indigo-100/80 hover:bg-white/10 hover:text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className={cn(
              "hidden rounded-full px-3.5 py-2 text-sm font-semibold sm:inline-flex",
              dark ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5",
            )}
          >
            Student login
          </Link>
          <Link href="/register" className={btn("gold", "sm")}>
            Register · {price}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn("grid h-10 w-10 place-items-center rounded-full xl:hidden", dark ? "text-white hover:bg-white/10" : "hover:bg-ink/5")}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container-x grid gap-1 border-t border-ink/8 pb-5 pt-3 xl:hidden" aria-label="Mobile">
          {[...NAV, { href: "/dashboard", label: "Student login" }, { href: "/schools/login", label: "School login" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-ink/5">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
