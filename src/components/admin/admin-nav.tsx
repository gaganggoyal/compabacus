"use client";

import { CalendarClock, Gauge, ListChecks, LogOut, Mail, School, Trophy, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/admin";
import { Logo } from "@/components/brand";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/registrations", label: "Registrations", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/schools", label: "Schools", icon: School },
  { href: "/admin/slots", label: "Slots", icon: CalendarClock },
  { href: "/admin/attempts", label: "Exam attempts", icon: ListChecks },
  { href: "/admin/results", label: "Results", icon: Trophy },
  { href: "/admin/emails", label: "Emails", icon: Mail },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <aside className="border-b border-white/10 bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
        <Link href="/admin">
          <Logo dark />
        </Link>
        <p className="mt-0 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300 lg:mt-2">Organiser panel</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
        {NAV.map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active ? "bg-white/10 text-white" : "text-indigo-100/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          );
        })}
        <form action={adminLogoutAction} className="lg:mt-4">
          <button type="submit" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-100/60 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </form>
      </nav>
    </aside>
  );
}
