import { BadgeCheck, CalendarClock, Gift, QrCode, School, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { OfferCountdown } from "@/components/offer-countdown";
import { OfferBadge, PriceTag } from "@/components/pricing";
import { Card, Eyebrow } from "@/components/ui";
import { pricing, site } from "@/lib/config";
import { rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";

export const metadata: Metadata = {
  title: `Register for ${rupees(pricing.individual.offer)} (launch offer)`,
  description: `Register your child for the ${site.name}: Nursery to Class 12, ages 4–18. Launch offer ${rupees(pricing.individual.offer)} instead of ${rupees(pricing.individual.regular)}, paid by UPI. Pick a one-hour exam slot in December.`,
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  const price = await pricingSnapshot();
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <Eyebrow>Registration · Step 1 of 3</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Register your child</h1>
          <p className="mt-3 text-lg text-ink/60">
            Takes about 2 minutes. Already registered?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Log in
            </Link>
            .
          </p>
          <Card className="mt-8 p-6 sm:p-10">
            <RegisterForm />
          </Card>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-ink p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Registration fee</p>
            <PriceTag plan="individual" offerLive={price.offerLive} dark className="mt-2" />
            <OfferBadge plan="individual" offerLive={price.offerLive} dark className="mt-3" />
            {price.offerLive && <OfferCountdown dark className="mt-3" label="Ends in" />}
            <ul className="mt-5 space-y-3.5 text-sm text-indigo-100/85">
              <li className="flex gap-3">
                <CalendarClock className="h-5 w-5 shrink-0 text-amber-300" /> One timed attempt in a one-hour slot you pick in December
              </li>
              <li className="flex gap-3">
                <Trophy className="h-5 w-5 shrink-0 text-amber-300" /> Ranking within your own class
              </li>
              <li className="flex gap-3">
                <BadgeCheck className="h-5 w-5 shrink-0 text-amber-300" /> QR-verified e-certificate
              </li>
              <li className="flex gap-3">
                <Gift className="h-5 w-5 shrink-0 text-amber-300" /> Surprise gift voucher for every class topper
              </li>
              <li className="flex gap-3">
                <QrCode className="h-5 w-5 shrink-0 text-amber-300" /> Pay with any UPI app on the next step
              </li>
            </ul>
          </div>
          <Link href="/schools" className="flex items-center gap-3 rounded-3xl bg-white p-5 ring-1 ring-ink/8 transition hover:ring-indigo-300">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <School className="h-5 w-5" />
            </span>
            <span className="text-sm">
              <b className="block">Registering a whole school?</b>
              <span className="text-ink/60">One fee for unlimited students →</span>
            </span>
          </Link>
          <p className="px-2 text-xs leading-relaxed text-ink/50">
            Registering more than one child? Complete this form once per child. Each gets their own Registration Number and payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
