import { ArrowRight, CalendarClock, Clock, RefreshCcw, School } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SlotPicker } from "@/components/slots/slot-picker";
import { SectionTitle, btn } from "@/components/ui";
import { site, slotRules } from "@/lib/config";
import { rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";
import { ALL_SLOTS } from "@/lib/slots";
import { availabilitySnapshot } from "@/lib/slots-server";

export const metadata: Metadata = {
  title: "December exam schedule & slots",
  description: `Pick a one-hour exam slot for the ${site.name}: ${ALL_SLOTS.length} slots across 1–31 December 2026, mornings, evenings and weekends, ${slotRules.capacity} seats each.`,
  alternates: { canonical: "/schedule" },
  openGraph: { url: "/schedule", title: `Exam schedule · ${site.name}` },
};

export default async function SchedulePage() {
  const [{ counts, asOf }, price] = await Promise.all([availabilitySnapshot(), pricingSnapshot()]);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: site.shortName, item: site.url },
            { "@type": "ListItem", position: 2, name: "Exam schedule", item: `${site.url}/schedule` },
          ],
        }}
      />
      <div className="container-x py-12 sm:py-16">
        <SectionTitle
          eyebrow="Exam schedule · December 2026"
          title="Pick your one-hour exam slot"
          sub={`The championship runs in ${ALL_SLOTS.length} slots across December: evenings on school days, more choice at weekends. Each slot has ${slotRules.capacity} seats, and the counts below are real bookings.`}
        />
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {[
            { icon: Clock, t: "Start any time within your hour" },
            { icon: RefreshCcw, t: "Missed it? Rebook another open slot" },
            { icon: CalendarClock, t: "Book after registering and paying" },
          ].map((x) => (
            <span key={x.t} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-ink/70 ring-1 ring-ink/8">
              <x.icon className="h-4 w-4 text-indigo-600" /> {x.t}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <SlotPicker counts={counts} asOf={asOf} />
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={btn("gold", "lg")}>
            Register · {rupees(price.individual)} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/schools" className={btn("outline", "lg")}>
            <School className="h-4 w-4" /> Booking for a school?
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink/50">Already registered? Log in and book from your dashboard.</p>
      </div>
    </>
  );
}
