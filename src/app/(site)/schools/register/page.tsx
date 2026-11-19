import { BadgeCheck, CalendarClock, Printer, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SchoolRegisterForm } from "@/components/forms/school-forms";
import { OfferCountdown } from "@/components/offer-countdown";
import { OfferBadge, PriceTag } from "@/components/pricing";
import { Card, Eyebrow } from "@/components/ui";
import { pricing, site } from "@/lib/config";
import { rupees } from "@/lib/pricing";
import { pricingSnapshot } from "@/lib/pricing-cache";

export const metadata: Metadata = {
  title: "Register your school",
  description: `Create a school account for the ${site.name}: ${rupees(pricing.school.offer)} launch price (regular ${rupees(pricing.school.regular)}) for unlimited students.`,
  alternates: { canonical: "/schools/register" },
};

export default async function SchoolRegisterPage() {
  const price = await pricingSnapshot();
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <Eyebrow>School registration · Step 1 of 2</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Register your school</h1>
          <p className="mt-3 text-lg text-ink/60">
            Takes about 2 minutes. Already registered?{" "}
            <Link href="/schools/login" className="font-semibold text-indigo-600 hover:underline">
              School login
            </Link>
            .
          </p>
          <Card className="mt-8 p-6 sm:p-10">
            <SchoolRegisterForm />
          </Card>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-ink p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">School plan</p>
            <PriceTag plan="school" offerLive={price.offerLive} dark className="mt-2" />
            <p className="text-sm text-indigo-100/70">one time · unlimited students</p>
            <OfferBadge plan="school" offerLive={price.offerLive} dark className="mt-4" />
            {price.offerLive && <OfferCountdown dark className="mt-3" label="Ends in" />}
            <ul className="mt-5 space-y-3.5 text-sm text-indigo-100/85">
              <li className="flex gap-3">
                <Users className="h-5 w-5 shrink-0 text-amber-300" /> Add any number of students, Nursery–Class 12
              </li>
              <li className="flex gap-3">
                <Printer className="h-5 w-5 shrink-0 text-amber-300" /> Print login slips with PINs
              </li>
              <li className="flex gap-3">
                <CalendarClock className="h-5 w-5 shrink-0 text-amber-300" /> Book slots for whole classes
              </li>
              <li className="flex gap-3">
                <BadgeCheck className="h-5 w-5 shrink-0 text-amber-300" /> Verified e-certificate for every student
              </li>
            </ul>
          </div>
          <p className="px-2 text-xs leading-relaxed text-ink/50">
            Registering one child? Parents can{" "}
            <Link href="/register" className="font-semibold underline">
              register individually
            </Link>{" "}
            instead.
          </p>
        </aside>
      </div>
    </div>
  );
}
