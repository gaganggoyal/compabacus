import {
  ArrowRight,
  BadgeCheck,
  Brain,
  CalendarDays,
  Clock,
  Crown,
  Eye,
  Hourglass,
  IndianRupee,
  Lightbulb,
  Medal,
  PartyPopper,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { AbacusArt, WhatsAppIcon, whatsappLink } from "@/components/brand";
import { Countdown, PhaseCta } from "@/components/countdown";
import { Badge, Card, SectionTitle, btn, cn } from "@/components/ui";
import { AGE_GROUPS, prizes, site } from "@/lib/config";
import { LEVELS, totalQuestions } from "@/lib/exam/levels";

const STEPS = [
  { icon: Sparkles, title: "Register in 2 minutes", text: "Parent fills one simple form and sets a 6-digit PIN. You get a Registration Number instantly." },
  { icon: QrCode, title: "Pay ₹10 by UPI QR", text: "Scan with GPay, PhonePe, Paytm or any UPI app. Enter the 12-digit UPI reference — done." },
  { icon: Brain, title: "Practise for free", text: "Unlimited mock tests at your level, with instant scores and answer review." },
  { icon: Hourglass, title: "Take the exam any day in December", text: "Pick a calm time between 1–31 Dec. One sitting, 8–12 minutes, on phone, tablet or laptop." },
  { icon: PartyPopper, title: "Winners on New Year's Day", text: "Results go live at midnight on 1 Jan 2027. Download your verified e-certificate." },
];

const FAIR = [
  { icon: Sparkles, title: "A unique paper for every child", text: "Same difficulty, different numbers — so answers can't be shared during the month." },
  { icon: Clock, title: "Server-timed, auto-submitted", text: "The clock runs on our server. Answers autosave every few seconds, even if the internet drops." },
  { icon: Eye, title: "Focus tracking", text: "Leaving the exam screen is recorded. Repeated switching is reviewed before results." },
  { icon: ShieldCheck, title: "Transparent ranking", text: "Highest score wins; ties are broken by the shorter time taken. Every certificate has a QR to verify." },
];

const FAQ = [
  {
    q: "Who can participate?",
    a: `Any child aged 4 to 18 (age as on 1 December 2026), from any abacus academy, school or home learner. No affiliation needed.`,
  },
  {
    q: "How do I choose the right level?",
    a: "Pick the level that matches what your child has learnt so far — each level lists exactly what is asked. If unsure, take a free mock test at two levels and choose the one where they score 60–90%.",
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
    a: "We match every UPI reference number against our bank statement, usually within 24 hours. You can still take the exam while verification is pending; only verified entries are ranked.",
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

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grain absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="container-x relative grid items-center gap-14 pb-24 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pb-32">
          <div className="animate-fade-up">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white/[0.07] py-1.5 pl-1.5 pr-4 text-sm ring-1 ring-white/10">
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-ink">1–31 DEC 2026</span>
              <span className="text-indigo-100/80">100% online · Ages 4–18</span>
            </div>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              The <span className="gold-text animate-shine">Abacus Stars</span> Championship 2026
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/80 sm:text-xl">
              A fair, timed online abacus exam for every child — taken from home, any day in December. Winners are crowned on{" "}
              <span className="font-semibold text-white">New Year&apos;s Day</span>.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PhaseCta />
              <Link href="/practice" className={btn("light", "lg")}>
                Try a free mock test <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Countdown className="mt-10" />
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <AbacusArt className="mx-auto max-w-[30rem]" />
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.03]">
          <div className="container-x grid grid-cols-2 divide-white/10 py-6 sm:grid-cols-4 sm:divide-x">
            {[
              { k: "₹10", v: "registration fee" },
              { k: "31 days", v: "to take the exam" },
              { k: "7 levels", v: "× 6 age groups" },
              { k: "100%", v: "children get certificates" },
            ].map((s) => (
              <div key={s.k} className="px-2 py-2 text-center sm:px-6">
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
          title="From sign-up to certificate in five easy steps"
          sub="Designed for busy parents: no centre visits, no long forms, no app downloads."
        />
        <ol className="mt-14 grid gap-5 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Card className="h-full p-6">
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

      {/* FORMAT */}
      <section id="format" className="scroll-mt-20 bg-sand/60 py-24">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle
              eyebrow="Exam format"
              title="Seven levels, from first beads to Grand Master"
              sub="Every paper has a written section and a Flash Round. Higher levels add multiplication and division. Answers are typed — no multiple-choice guessing."
            />
            <Link href="/rules" className={cn(btn("outline"), "self-start lg:self-auto")}>
              Full rules & syllabus <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Lightbulb, t: "Add & Subtract", d: "Vertical sums, 3–6 rows, 1 to 4 digits." },
              { icon: Medal, t: "Multiplication", d: "From 2×1 up to 3×2 digits (Level 3+)." },
              { icon: Crown, t: "Division", d: "Exact division up to 4÷2 digits (Level 4+)." },
              { icon: Zap, t: "Flash Round", d: "Numbers flash one at a time — add them up mentally." },
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
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="bg-ink text-xs uppercase tracking-wider text-indigo-100/80">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Level</th>
                    <th className="px-5 py-4 font-semibold">What&apos;s tested</th>
                    <th className="px-5 py-4 font-semibold">Best for</th>
                    <th className="px-5 py-4 text-right font-semibold">Questions</th>
                    <th className="px-5 py-4 text-right font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {LEVELS.map((l) => (
                    <tr key={l.id} className="hover:bg-indigo-50/40">
                      <td className="px-5 py-4">
                        <span className="font-display font-bold">{l.name}</span>
                        <span className="ml-2 text-xs font-semibold text-ink/40">{l.id}</span>
                      </td>
                      <td className="px-5 py-4 text-ink/70">{l.description}</td>
                      <td className="px-5 py-4 text-ink/60">{l.suitedFor}</td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">{totalQuestions(l)}</td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">{l.durationSec / 60} min</td>
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
          title="Children compete only with their own age and level"
          sub="Every age group × level is a separate category with its own Champion and Runners-up — so a 6-year-old is never ranked against a 14-year-old."
          center
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGE_GROUPS.map((g, i) => (
            <div
              key={g.id}
              className="group relative overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-ink/8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/10"
            >
              <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 transition group-hover:scale-125"
                style={{ background: ["#f59e0b", "#818cf8", "#f43f5e", "#34d399", "#38bdf8", "#a78bfa"][i] }}
              />
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Group {g.id}</p>
              <p className="mt-2 font-display text-2xl font-bold">{g.label}</p>
              <p className="mt-1 text-ink/60">
                Ages {g.min}–{g.max}
              </p>
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
            sub="Top 3 in every category are crowned, high scorers earn Distinction and Merit, and every participant gets a verified e-certificate."
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
        </div>
      </section>

      {/* TIMELINE */}
      <section className="container-x py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <SectionTitle
            eyebrow="Key dates"
            title="One month. One sitting. One New Year celebration."
            sub="All times are Indian Standard Time. Registrations stay open until the exam window closes."
          />
          <ol className="relative space-y-8 border-l-2 border-dashed border-indigo-200 pl-8">
            {[
              { icon: Sparkles, d: "Open now", t: "Registrations & free mock tests", x: "Register for ₹10 and start practising immediately." },
              { icon: CalendarDays, d: "1 Dec 2026, 12:00 AM", t: "Exam window opens", x: "Take your one timed attempt on any day you like." },
              { icon: Hourglass, d: "31 Dec 2026, 11:59 PM", t: "Exam window closes", x: "Last chance to start — don't leave it to the final hour!" },
              { icon: PartyPopper, d: "1 Jan 2027, 12:00 AM", t: "Winners announced", x: "Results, Hall of Fame and certificates go live." },
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

      {/* WHY ₹10 */}
      <section className="container-x py-24">
        <div className="grid items-center gap-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white sm:p-14 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Why just ₹10?</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-balance sm:text-4xl">
              Talent shouldn&apos;t depend on a ₹1,000 entry fee.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-indigo-100/85">
              We keep the fee symbolic so every child — from big cities to small towns — can test their skills on a national stage.
              Same exam, same certificate, same chance to be Champion.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
            <ul className="space-y-4 text-[15px]">
              {[
                { icon: IndianRupee, t: "₹10 per child, one-time" },
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
          <p className="mt-4 max-w-xl text-lg text-indigo-100/75">Register today for ₹10 and start practising with free mock tests.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={btn("gold", "lg")}>
              Register · ₹10
            </Link>
            <Link href="/practice" className={btn("light", "lg")}>
              Free mock test
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
