import { BadgeCheck, CalendarDays, QrCode, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";
import { Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Register for ₹10",
  description: "Register your child for the online abacus championship. Ages 4–18. ₹10 via UPI.",
};

export default function RegisterPage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <Eyebrow>Registration · Step 1 of 2</Eyebrow>
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
            <p className="font-display text-lg font-bold">What you get for ₹10</p>
            <ul className="mt-4 space-y-3.5 text-sm text-indigo-100/85">
              <li className="flex gap-3">
                <CalendarDays className="h-5 w-5 shrink-0 text-amber-300" /> One timed exam attempt, any day 1–31 December
              </li>
              <li className="flex gap-3">
                <Trophy className="h-5 w-5 shrink-0 text-amber-300" /> Ranking within your own class
              </li>
              <li className="flex gap-3">
                <BadgeCheck className="h-5 w-5 shrink-0 text-amber-300" /> QR-verified e-certificate
              </li>
              <li className="flex gap-3">
                <QrCode className="h-5 w-5 shrink-0 text-amber-300" /> Pay with any UPI app on the next step
              </li>
            </ul>
          </div>
          <p className="px-2 text-xs leading-relaxed text-ink/50">
            Registering more than one child? Complete this form once per child — each gets their own Registration Number and ₹10 payment.
          </p>
        </aside>
      </div>
    </div>
  );
}
