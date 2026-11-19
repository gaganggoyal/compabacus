import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  IndianRupee,
  KeyRound,
  LayoutDashboard,
  Printer,
  School,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon, whatsappLink } from "@/components/brand";
import { JsonLd } from "@/components/json-ld";
import { OfferCountdown } from "@/components/offer-countdown";
import { OfferBadge, PriceTag } from "@/components/pricing";
import { Card, SectionTitle, btn, cn } from "@/components/ui";
import { pricing, site } from "@/lib/config";
import { OFFER_END_LABEL, rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";

export const metadata: Metadata = {
  title: `School registration: unlimited students for ${rupees(pricing.school.offer)}`,
  description: `Register your whole school for the ${site.name}. One fee of ${rupees(pricing.school.offer)} (regular ${rupees(pricing.school.regular)}) covers any number of students, Nursery to Class 12. Bulk-add students, print login slips and book exam slots for a whole class.`,
  alternates: { canonical: "/schools" },
  openGraph: { url: "/schools", title: `Register your school · ${site.name}` },
};

const STEPS = [
  { icon: School, t: "Create a school account", d: "Two minutes: school name, contact person and a password." },
  { icon: IndianRupee, t: `Pay once by UPI`, d: "One payment covers every student you add. Nothing to collect from parents." },
  { icon: FileSpreadsheet, t: "Add your students", d: "One by one, or paste a class list straight from Excel or Google Sheets." },
  { icon: Printer, t: "Print login slips", d: "Every student gets a registration number and PIN, ready to hand out." },
  { icon: CalendarClock, t: "Book exam slots", d: "Book one slot for a whole class, e.g. your computer lab on a Saturday morning." },
  { icon: Trophy, t: "Results on 1 January", d: "Every student gets a verified e-certificate, and each class topper wins a surprise gift voucher." },
];

const FEATURES = [
  { icon: Users, t: "Unlimited students", d: "Nursery to Class 12, any number of students for one school fee." },
  { icon: LayoutDashboard, t: "School dashboard", d: "See every student's login, slot, exam status and result in one place." },
  { icon: KeyRound, t: "Logins you control", d: "View or reset any student's PIN. Students need no email address." },
  { icon: ClipboardList, t: "Class-wise papers", d: "Each class has its own paper and ranking, so children compete with classmates." },
  { icon: BadgeCheck, t: "Verified certificates", d: "Every certificate carries a QR code anyone can scan to verify." },
  { icon: CalendarClock, t: "Flexible slots", d: "Morning, evening and weekend slots across December. Rebook if a student is absent." },
];

const FAQ = [
  { q: "Who can register as a school?", a: "Any school, abacus academy, tuition or coaching centre in India. Students can also still register on their own with a parent." },
  {
    q: "Is it really unlimited?",
    a: `Yes. One school fee covers every student you add, from Nursery to Class 12. (A soft limit of 5,000 students per account only stops accidental duplicates; WhatsApp us if you need more.)`,
  },
  { q: "Do students need an email or phone?", a: "No. Each student logs in with the registration number and PIN on the slip you print. Parent contact details are optional; if you add a parent email, they get slot confirmations and the result." },
  { q: "Can students take the exam in our computer lab?", a: "Yes. Book a slot for the class and seat students at any phone, tablet or computer during that hour. Each student uses their own login." },
  { q: "What if a student misses their slot?", a: "Book another open slot for them from your dashboard. The exam only opens during a student's booked hour." },
  { q: "How do we pay?", a: "By UPI QR from the school dashboard, then enter the 12-digit UPI reference. We verify it within a day; students can book slots meanwhile." },
];

export default async function SchoolsPage() {
  const price = await pricingSnapshot();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: site.shortName, item: site.url },
            { "@type": "ListItem", position: 2, name: "Schools", item: `${site.url}/schools` },
          ],
        }}
      />
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grain absolute inset-0" />
        <div className="absolute -top-32 right-0 h-[30rem] w-[30rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="container-x relative grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1.2fr_1fr] lg:pb-28">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-1.5 text-sm text-indigo-100/80 ring-1 ring-white/10">
              <School className="h-4 w-4 text-amber-300" /> For schools, academies & coaching centres
            </p>
            <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Your whole school. <span className="gold-text animate-shine">One fee.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-indigo-100/80">
              Register every student for the {site.name} with a single payment. Add a class list in seconds, print login slips, and book exam slots
              for whole classes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/schools/register" className={btn("gold", "lg")}>
                Register your school <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/schools/login" className={btn("light", "lg")}>
                School login
              </Link>
            </div>
          </div>
          <Card className="relative p-7 text-ink sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">School plan</p>
            <div className="mt-3">
              <PriceTag plan="school" offerLive={price.offerLive} size="lg" />
            </div>
            <p className="mt-1 text-sm font-semibold text-ink/60">one time · unlimited students</p>
            <OfferBadge plan="school" offerLive={price.offerLive} className="mt-4" />
            {price.offerLive && <OfferCountdown className="mt-3" label="Offer ends in" />}
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Any number of students, Nursery–Class 12", "Bulk add from Excel / Google Sheets", "Login slips with PINs", "Book slots for whole classes", "Free mock tests for every student", "Verified e-certificates for all"].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" /> {x}
                </li>
              ))}
            </ul>
            <Link href="/schools/register" className={cn(btn("primary", "lg"), "mt-7 w-full")}>
              Get started
            </Link>
            {price.offerLive && (
              <p className="mt-3 text-center text-xs text-ink/50">
                Launch price until {OFFER_END_LABEL}. Schools that register before then keep it.
              </p>
            )}
          </Card>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24">
        <SectionTitle eyebrow="How it works" title="Set up your school in an afternoon" sub="No forms to collect from parents, no fees to chase." />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <Card className="h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-4xl font-extrabold text-ink/[0.07]">{i + 1}</span>
                </div>
                <p className="mt-5 font-display text-lg font-bold">{s.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sand/60 py-20 sm:py-24">
        <div className="container-x">
          <SectionTitle eyebrow="Built for schools" title="Everything a coordinator needs" center />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-3xl bg-white p-6 ring-1 ring-ink/8">
                <f.icon className="h-6 w-6 text-amber-500" />
                <p className="mt-4 font-display text-lg font-bold">{f.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/60">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionTitle eyebrow="FAQ" title="Questions schools ask" />
            <a href={whatsappLink("Hi! I'd like to register our school for the Kudos Cup.")} target="_blank" rel="noopener noreferrer" className={cn(btn("outline"), "mt-6")}>
              <WhatsAppIcon className="text-emerald-500" /> Talk to us on WhatsApp
            </a>
          </div>
          <div className="divide-y divide-ink/10 rounded-3xl bg-white px-6 ring-1 ring-ink/8 sm:px-8">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ink py-16 text-white">
        <div className="grain absolute inset-0" />
        <div className="container-x relative flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-balance sm:text-4xl">Give every student in your school a shot at the {site.shortName}</h2>
          <PriceTag plan="school" offerLive={price.offerLive} size="md" dark />
          <Link href="/schools/register" className={btn("gold", "lg")}>
            Register your school
          </Link>
        </div>
      </section>
    </>
  );
}
