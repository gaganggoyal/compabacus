import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CalendarClock,
  CalendarDays,
  Check,
  Clock,
  Crown,
  Eye,
  Gift,
  Hourglass,
  IndianRupee,
  Lightbulb,
  Medal,
  PartyPopper,
  QrCode,
  School,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Trophy,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AbacusArt, WhatsAppIcon, whatsappLink } from "@/components/brand";
import { Countdown } from "@/components/countdown";
import { JsonLd } from "@/components/json-ld";
import { OfferCountdown } from "@/components/offer-countdown";
import { OfferBadge, PriceTag } from "@/components/pricing";
import { SlotPicker } from "@/components/slots/slot-picker";
import { StickyCta } from "@/components/sticky-cta";
import { Badge, Card, SectionTitle, btn, cn } from "@/components/ui";
import { pricing, prizes, schedule, site, slotRules, toppersReward } from "@/lib/config";
import { DURATION_MINUTES, GRADES, STAGES, totalQuestions } from "@/lib/exam/papers";
import { OFFER_END_LABEL, rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";
import { ALL_SLOTS } from "@/lib/slots";
import { availabilitySnapshot } from "@/lib/slots-server";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const STEPS = [
  { icon: Sparkles, title: "Register in 2 minutes", text: "Parent fills one simple form and sets a 6-digit PIN. You get a Registration Number instantly." },
  { icon: QrCode, title: "Pay by UPI QR", text: "Scan with GPay, PhonePe, Paytm or any UPI app, then enter the 12-digit UPI reference." },
  { icon: CalendarClock, title: "Book your exam slot", text: "Pick a one-hour slot in December: weekday evenings, or more choice at weekends." },
  { icon: Brain, title: "Practise for free", text: "Unlimited mock tests for your class, with instant scores and answer review." },
  {
    icon: Hourglass,
    title: "Take the exam in your slot",
    text: `One sitting of ${DURATION_MINUTES.min}–${DURATION_MINUTES.max} minutes on a phone, tablet or laptop. Missed your slot? Book another.`,
  },
  { icon: PartyPopper, title: "Winners on New Year's Day", text: "Results go live at midnight on 1 Jan 2027. Every child gets a verified e-certificate, and each class topper wins a surprise gift voucher." },
];

const FAIR = [
  { icon: Sparkles, title: "A unique paper for every child", text: "Same difficulty, different numbers — so answers can't be shared during the month." },
  { icon: Clock, title: "Server-timed, auto-submitted", text: "The clock runs on our server. Answers autosave every few seconds, even if the internet drops." },
  { icon: Eye, title: "Focus tracking", text: "Leaving the exam screen is recorded. Repeated switching is reviewed before results." },
  { icon: ShieldCheck, title: "Transparent ranking", text: "Highest score wins; ties are broken by the shorter time taken. Every certificate has a QR to verify." },
];

const FAQ = [
  {
    q: "How much does it cost?",
    a: `Registration is ${rupees(pricing.individual.regular)} per child. As a launch offer it is just ${rupees(pricing.individual.offer)} for registrations made by ${OFFER_END_LABEL} 2026, and you keep that price even if you pay later. Schools pay ${rupees(pricing.school.offer)} instead of ${rupees(pricing.school.regular)} for any number of students.`,
  },
  {
    q: "Who can participate?",
    a: `Any child from Nursery to Class 12 (aged 4 to 18 on 1 December 2026), from any school, abacus academy or home learning. No affiliation needed.`,
  },
  {
    q: "What do the toppers win?",
    a: `The topper of every class is crowned Champion and wins a surprise gift voucher, along with a gold e-trophy certificate and a Hall of Fame spot: one voucher for each of the 15 classes, Nursery to Class 12. The 2nd and 3rd in each class are crowned Runners-up with Silver and Bronze certificates. ${toppersReward.delivery}`,
  },
  {
    q: "How do exam slots work?",
    a: `After paying, pick a one-hour slot between 1 and 31 December. The exam can be started any time during that hour. Each slot has ${slotRules.capacity} seats, first come, first served. Missed it? Book another open slot from your dashboard.`,
  },
  {
    q: "Which paper will my child get?",
    a: "The paper for their school class in the current session. Every class from Nursery to Class 12 has its own paper and its own ranking — from 2-row single-digit sums in Nursery up to 5-digit sums, multiplication and division in Class 12. Try the exact format free in the mock tests.",
  },
  {
    q: "Is the exam multiple choice?",
    a: "Yes. Every question, including the Flash Round, shows four options — tap the right one. There is no negative marking, and ties are broken by the shorter time taken.",
  },
  {
    q: "Can our school register its students?",
    a: `Yes. A school account (${rupees(pricing.school.offer)} launch price) covers unlimited students. The school adds students from a class list, prints login slips and books slots, even one slot for a whole class.`,
  },
  {
    q: "Is a physical abacus allowed?",
    a: "Yes, for the written sections students may use their own abacus. The Flash Round is mental (numbers flash one by one). Calculators, phones for calculation, and help from adults are not allowed.",
  },
  {
    q: "What device do I need?",
    a: "Any phone, tablet, laptop or desktop with a modern browser and internet. A laptop or tablet is the most comfortable. Nothing to install.",
  },
  {
    q: "Can I take the exam more than once?",
    a: "No — every registered student gets exactly one attempt. Mock tests are unlimited and free though, so practise as much as you like.",
  },
  {
    q: "My payment is done but status says 'under verification'?",
    a: "We match every UPI reference number against our bank statement, usually within 24 hours. You can book your slot and take the exam while verification is pending; only verified entries are ranked.",
  },
  {
    q: "What if the internet disconnects during the exam?",
    a: "Your answers autosave. Log in again from the same or another device and continue — the timer keeps running from when you started, so reconnect quickly.",
  },
  {
    q: "When and where are results announced?",
    a: "On 1 January 2027 at 12:00 AM IST on the Results page and your dashboard. Certificates can be downloaded immediately.",
  },
];

export default async function Home() {
  const [price, avail] = await Promise.all([pricingSnapshot(), availabilitySnapshot()]);
  const fee = rupees(price.individual);
  const eventLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: site.name,
    description: `Online abacus competition for Nursery to Class 12 with a separate paper and ranking for every class. Exam slots across 1–31 December 2026; winners announced on 1 January 2027, and the topper of every class wins a surprise gift voucher.`,
    startDate: schedule.examStart,
    endDate: schedule.examEnd,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: site.url },
    image: [`${site.url}/opengraph-image`],
    inLanguage: "en-IN",
    educationalLevel: "Nursery to Class 12",
    organizer: { "@type": "Organization", name: site.organiser, url: site.url },
    offers: [
      {
        "@type": "Offer",
        name: price.offerLive ? "Student registration (launch offer)" : "Student registration",
        price: price.individual,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${site.url}/register`,
        ...(price.offerLive ? { validThrough: pricing.offerEndsAt } : {}),
      },
      {
        "@type": "Offer",
        name: price.offerLive ? "School registration, unlimited students (launch offer)" : "School registration, unlimited students",
        price: price.school,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `${site.url}/schools/register`,
        ...(price.offerLive ? { validThrough: pricing.offerEndsAt } : {}),
      },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <>
      <JsonLd data={[eventLd, faqLd]} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grain absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="container-x relative grid items-center gap-14 pb-20 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
          <div className="animate-fade-up">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-1.5 pr-4 text-sm ring-1 ring-white/10">
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-ink">1–31 DEC 2026</span>
              <span className="text-indigo-100/80">100% online · Nursery to Class 12</span>
            </div>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              <span className="gold-text animate-shine">{site.shortName}</span> {site.event}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/80 sm:text-xl">
              India&apos;s online abacus competition for every child: a paper for each class, an exam slot you pick in December, and winners crowned on{" "}
              <span className="font-semibold text-white">New Year&apos;s Day</span>.
            </p>
            <a
              href="#awards"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3.5 py-1.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-300/30 transition hover:bg-amber-400/25"
            >
              <Gift className="h-4 w-4" /> {toppersReward.short} <ArrowRight className="h-3.5 w-3.5" />
            </a>

            <div className="mt-8 max-w-xl rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Registration fee</p>
                  <PriceTag plan="individual" offerLive={price.offerLive} size="lg" dark className="mt-1" />
                </div>
                <OfferBadge plan="individual" offerLive={price.offerLive} dark className="mb-2" />
              </div>
              {price.offerLive && <OfferCountdown dark className="mt-4" />}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={btn("gold", "lg")}>
                Register now · {fee}
              </Link>
              <Link href="/schools" className={btn("light", "lg")}>
                <School className="h-4 w-4" /> Register a school
              </Link>
            </div>
            <Link href="/practice" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-100/80 hover:text-white">
              Not sure yet? Try a free mock test <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <AbacusArt className="mx-auto max-w-[30rem]" />
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.03]">
          <div className="container-x grid grid-cols-2 divide-white/10 py-6 sm:grid-cols-4 sm:divide-x">
            {[
              { k: fee, v: price.offerLive ? `launch fee · regular ${rupees(pricing.individual.regular)}` : "registration fee" },
              { k: `${ALL_SLOTS.length} slots`, v: "across December" },
              { k: "15 classes", v: "Nursery to Class 12" },
              { k: "100%", v: "children get certificates" },
            ].map((s) => (
              <div key={s.v} className="px-2 py-2 text-center sm:px-6">
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">{s.k}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-indigo-200/60">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x py-24" id="how">
        <SectionTitle
          eyebrow="How it works"
          title="From sign-up to certificate in six easy steps"
          sub="Designed for busy parents: no centre visits, no long forms, no app downloads."
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Card className="h-full p-6 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/10">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-4xl font-extrabold text-ink/[0.07]">{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-20 bg-sand/60 py-24">
        <div className="container-x">
          <SectionTitle
            center
            eyebrow="Pricing"
            title={price.offerLive ? <>Launch offer: register for just {fee}</> : "Simple, one-time pricing"}
            sub={
              price.offerLive
                ? `Prices go up after ${OFFER_END_LABEL}. Your price is locked in the moment you register, even if you pay later.`
                : "One payment covers the exam, mock tests and a verified certificate."
            }
          />
          {price.offerLive && (
            <div className="mt-6 flex justify-center">
              <OfferCountdown className="justify-center" />
            </div>
          )}
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="flex flex-col p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">For parents</p>
              <p className="mt-2 font-display text-2xl font-bold">One child</p>
              <div className="mt-4">
                <PriceTag plan="individual" offerLive={price.offerLive} size="lg" />
                <p className="text-sm font-semibold text-ink/50">per child · one time</p>
              </div>
              <OfferBadge plan="individual" offerLive={price.offerLive} className="mt-4 self-start" />
              <ul className="mt-6 flex-1 space-y-3 text-[15px]">
                {["One exam attempt in the slot you pick", "Class-wise paper and ranking", "Unlimited free mock tests", "QR-verified e-certificate", "Surprise gift voucher for every class topper", "Results on 1 January 2027"].map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {x}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={cn(btn("primary", "lg"), "mt-8 w-full")}>
                Register your child
              </Link>
            </Card>
            <div className="relative flex flex-col overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-2xl shadow-indigo-900/30">
              <div className="grain absolute inset-0" />
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">For schools & academies</p>
                    <p className="mt-2 font-display text-2xl font-bold">Unlimited students</p>
                  </div>
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-ink">One fee</span>
                </div>
                <div className="mt-4">
                  <PriceTag plan="school" offerLive={price.offerLive} size="lg" dark />
                  <p className="text-sm font-semibold text-indigo-100/60">per school · one time</p>
                </div>
                <OfferBadge plan="school" offerLive={price.offerLive} dark className="mt-4 self-start" />
                <ul className="mt-6 flex-1 space-y-3 text-[15px] text-indigo-50/90">
                  {["Any number of students, Nursery–Class 12", "Add a whole class list from Excel", "Print login slips with PINs", "Book slots for whole classes", "School dashboard with every result"].map((x) => (
                    <li key={x} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> {x}
                    </li>
                  ))}
                </ul>
                <Link href="/schools" className={cn(btn("gold", "lg"), "mt-8 w-full")}>
                  Register your school
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SLOTS */}
      <section id="slots" className="container-x scroll-mt-20 py-24">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionTitle
            eyebrow="Exam slots"
            title="Pick your hour. Any day in December."
            sub={`${ALL_SLOTS.length} one-hour slots: weekday evenings, with more choice at weekends. ${slotRules.capacity} seats per slot, and the counts are live bookings. Tap a date to see its times.`}
          />
          <Link href="/schedule" className={cn(btn("outline"), "self-start lg:self-auto")}>
            Full schedule <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12">
          <SlotPicker counts={avail.counts} asOf={avail.asOf} />
        </div>
        <p className="mt-5 text-sm text-ink/55">You book your slot after registering and paying. Missed it on the day? Simply book another open slot.</p>
      </section>

      {/* FORMAT */}
      <section id="format" className="scroll-mt-20 bg-sand/60 py-24">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle
              eyebrow="Exam format"
              title="A paper for every class, Nursery to Class 12"
              sub="Every paper has abacus sums and a Flash Round; from Class 3 up, multiplication and division join in. Every question is multiple choice — four options, one correct — so even the youngest children can answer with a tap."
            />
            <Link href="/rules" className={cn(btn("outline"), "self-start lg:self-auto")}>
              Full rules & syllabus <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lightbulb, t: "Add & Subtract", d: "Vertical sums, 2–6 rows, 1 to 5 digits." },
              { icon: Medal, t: "Multiplication", d: "From 2×1 in Class 3 up to 4×3 digits in Class 12." },
              { icon: Crown, t: "Division", d: "Exact division from Class 5, up to 6÷3 digits." },
              { icon: Zap, t: "Flash Round", d: "Numbers flash one at a time — add them in your head." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl bg-white p-6 ring-1 ring-ink/8">
                <x.icon className="h-6 w-6 text-amber-500" />
                <p className="mt-4 font-display text-lg font-bold">{x.t}</p>
                <p className="mt-1 text-sm text-ink/60">{x.d}</p>
              </div>
            ))}
          </div>
          <Card className="mt-8 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-ink text-xs uppercase tracking-wider text-indigo-100/80">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">What&apos;s tested</th>
                    <th className="px-5 py-4 text-right font-semibold">Questions</th>
                    <th className="px-5 py-4 text-right font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {GRADES.map((g) => (
                    <tr key={g.id} className="hover:bg-indigo-50/40">
                      <td className="whitespace-nowrap px-5 py-3.5 font-display font-bold">{g.label}</td>
                      <td className="px-5 py-3.5 text-ink/70">{g.summary} + Flash Round</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{totalQuestions(g.paper)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{g.paper.durationSec / 60} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="container-x scroll-mt-20 py-24">
        <SectionTitle
          eyebrow="Categories"
          title="Children compete only with their own class"
          sub="Every class is a separate category with its own Champion and Runners-up — so a UKG child is never ranked against a Class 5 child."
          center
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((st, i) => (
            <div
              key={st.id}
              className="group relative overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-ink/8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/10"
            >
              <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 transition group-hover:scale-125"
                style={{ background: ["#f59e0b", "#818cf8", "#f43f5e", "#34d399"][i] }}
              />
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">{st.short}</p>
              <p className="mt-2 font-display text-2xl font-bold">{st.label}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {GRADES.filter((g) => g.stage === st.id).map((g) => (
                  <Link
                    key={g.id}
                    href={`/practice?class=${g.id}`}
                    className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/70 transition hover:bg-indigo-600 hover:text-white"
                  >
                    {g.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AWARDS */}
      <section id="awards" className="relative scroll-mt-20 overflow-hidden bg-ink py-24 text-white">
        <div className="grain absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[100px]" />
        <div className="container-x relative">
          <SectionTitle
            dark
            center
            eyebrow="Awards"
            title={
              <>
                Every child is a <span className="gold-text">star</span>
              </>
            }
            sub="The top 3 in every class are crowned, every class topper wins a surprise gift voucher, high scorers earn Distinction and Merit, and every participant gets a verified e-certificate."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {prizes.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-3xl p-7 ring-1",
                  i === 0 ? "bg-gradient-to-b from-amber-300/20 to-amber-500/5 ring-amber-300/30" : "bg-white/[0.04] ring-white/10",
                )}
              >
                {i === 0 ? (
                  <Trophy className="h-8 w-8 text-amber-300" />
                ) : i === 1 ? (
                  <Medal className="h-8 w-8 text-slate-300" />
                ) : i === 2 ? (
                  <Sparkles className="h-8 w-8 text-violet-300" />
                ) : (
                  <BadgeCheck className="h-8 w-8 text-emerald-300" />
                )}
                <p className="mt-5 font-display text-xl font-bold">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-indigo-100/70">{p.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-5 rounded-3xl bg-gradient-to-r from-amber-300/20 via-amber-400/10 to-violet-400/10 p-7 ring-1 ring-amber-300/30 sm:flex-row sm:items-center sm:p-8">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-ink shadow-lg shadow-amber-500/20">
              <Gift className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Surprise reward for toppers</p>
              <p className="mt-1.5 font-display text-2xl font-bold text-balance">A gift voucher for the topper of every class</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-indigo-100/75">
                The Champion of each of the 15 classes, Nursery to Class 12, also wins a surprise gift voucher, sent after the results. Which
                one? That stays a secret until results day!
              </p>
            </div>
            <Ticket className="hidden h-16 w-16 shrink-0 text-amber-300/40 lg:block" />
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              eyebrow="Key dates"
              title="One month. One sitting. One New Year celebration."
              sub="All times are Indian Standard Time. Registrations stay open until the last slots on 31 December."
            />
            <Countdown dark={false} className="mt-8" />
          </div>
          <ol className="relative space-y-8 border-l-2 border-dashed border-indigo-200 pl-8">
            {[
              { icon: Sparkles, d: "Open now", t: "Registrations, slot booking & free mock tests", x: `Register for ${fee} and start practising immediately.` },
              ...(price.offerLive ? [{ icon: IndianRupee, d: `${OFFER_END_LABEL} 2026, 11:59 PM`, t: "Launch offer ends", x: `After this, registration costs ${rupees(pricing.individual.regular)} (schools ${rupees(pricing.school.regular)}).` }] : []),
              { icon: CalendarDays, d: "1 Dec 2026", t: "First exam slots", x: "Take your one timed attempt in the slot you booked." },
              { icon: Hourglass, d: "31 Dec 2026", t: "Last exam slots", x: "Book early: popular evening and weekend slots fill first." },
              { icon: PartyPopper, d: "1 Jan 2027, 12:00 AM", t: "Winners announced", x: "Results, Hall of Fame and certificates go live. Toppers' gift vouchers are sent soon after." },
            ].map((s) => (
              <li key={s.t} className="relative">
                <span className="absolute -left-[3.05rem] grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-white ring-4 ring-cream">
                  <s.icon className="h-4 w-4" />
                </span>
                <Badge tone="amber">{s.d}</Badge>
                <p className="mt-2 font-display text-xl font-bold">{s.t}</p>
                <p className="mt-1 text-ink/60">{s.x}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAIR PLAY */}
      <section className="bg-sand/60 py-24">
        <div className="container-x">
          <SectionTitle
            eyebrow="Fair play"
            title="Built so the best abacus skills win"
            sub="Parents trust a competition when it's fair. Here's how we keep it that way."
            center
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FAIR.map((f) => (
              <Card key={f.title} className="p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-amber-300">
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="mt-5 font-display text-lg font-bold">{f.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* LAUNCH OFFER / SCHOOLS */}
      <section className="container-x py-24">
        <div className="grid items-center gap-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white sm:p-14 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{price.offerLive ? `Why ${fee}?` : "Bring your school"}</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-balance sm:text-4xl">
              {price.offerLive ? "Talent shouldn't depend on an expensive entry fee." : "One fee for your whole school."}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-indigo-100/85">
              {price.offerLive
                ? `For our first edition, every registration made by ${OFFER_END_LABEL} costs ${fee} instead of ${rupees(pricing.individual.regular)}, so every child, from big cities to small towns, can test their skills on a national stage. Same exam, same certificate, same chance to be Champion.`
                : `Schools register any number of students for ${rupees(price.school)}, add a class list in seconds and book slots for whole classes.`}
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
            <ul className="space-y-4 text-[15px]">
              {[
                { icon: IndianRupee, t: price.offerLive ? `${fee} per child until ${OFFER_END_LABEL}` : `${fee} per child, one time` },
                { icon: School, t: `Schools: ${rupees(price.school)} for unlimited students` },
                { icon: QrCode, t: "Pay with any UPI app via QR" },
                { icon: Smartphone, t: "Works on phone, tablet & laptop" },
                { icon: BadgeCheck, t: "QR-verified e-certificate included" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                    <x.icon className="h-4 w-4" />
                  </span>
                  {x.t}
                </li>
              ))}
            </ul>
            <Link href="/register" className={cn(btn("gold", "lg"), "mt-6 w-full")}>
              Register now
            </Link>
          </div>
        </div>
      </section>

      {/* FOUNDERS */}
      <section id="about" className="container-x scroll-mt-20 pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionTitle eyebrow="Who we are" title="Meet the founders" />
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/65">
              {site.shortName} was started by {site.founders[0].name} with co-founder {site.founders[1].name}, to give every child a fair, affordable
              stage: a paper for their own class, a slot that suits the family, and a certificate for everyone who takes part.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {site.founders.map((f) => (
              <div key={f.name} className="flex items-center gap-4 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink font-display text-2xl font-bold text-amber-300" aria-hidden>
                  {f.name[0]}
                </span>
                <div>
                  <p className="font-display text-xl font-bold">{f.name}</p>
                  <p className="text-sm font-semibold text-indigo-600">{f.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x scroll-mt-20 pb-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionTitle eyebrow="FAQ" title="Questions parents ask us" />
            <p className="mt-4 text-ink/60">Can&apos;t find your answer? We reply quickly on WhatsApp.</p>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className={cn(btn("outline"), "mt-6")}>
              <WhatsAppIcon className="text-emerald-500" /> Chat on WhatsApp
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

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-ink py-20 text-white">
        <div className="grain absolute inset-0" />
        <div className="container-x relative flex flex-col items-center text-center">
          <Trophy className="h-12 w-12 text-amber-300" />
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-extrabold text-balance sm:text-5xl">
            Will your child be a {site.shortName} Champion?
          </h2>
          <div className="mt-6">
            <PriceTag plan="individual" offerLive={price.offerLive} size="md" dark />
          </div>
          {price.offerLive && <OfferCountdown dark className="mt-3 justify-center" />}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={btn("gold", "lg")}>
              Register · {fee}
            </Link>
            <Link href="/practice" className={btn("light", "lg")}>
              Free mock test
            </Link>
          </div>
        </div>
      </section>
      <div className="h-20 lg:hidden" aria-hidden />
      <StickyCta />
    </>
  );
}
