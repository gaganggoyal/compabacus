import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { site } from "@/lib/config";
import { Logo, WhatsAppIcon, whatsappLink } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-indigo-100/75 print:hidden">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            A fair, affordable online abacus championship that helps every child show off their mental-maths superpower.
          </p>
          <p className="mt-4 text-xs text-indigo-100/50">Organised by {site.organiser}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Competition</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href="/register">Register</Link></li>
            <li><Link className="hover:text-white" href="/practice">Free mock tests</Link></li>
            <li><Link className="hover:text-white" href="/rules">Rules & syllabus</Link></li>
            <li><Link className="hover:text-white" href="/results">Results & Hall of Fame</Link></li>
            <li><Link className="hover:text-white" href="/verify">Verify a certificate</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Policies</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href="/terms">Terms & conditions</Link></li>
            <li><Link className="hover:text-white" href="/privacy">Privacy policy</Link></li>
            <li><Link className="hover:text-white" href="/refund-policy">Refund policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Need help?</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                <WhatsAppIcon className="h-4 w-4 text-emerald-400" /> WhatsApp us
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-300" /> {site.contact.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-300" /> {site.contact.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-300" /> {site.contact.city}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-indigo-100/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.organiser}. All rights reserved.</p>
          <p>All times are Indian Standard Time (IST).</p>
        </div>
      </div>
    </footer>
  );
}
