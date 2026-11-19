import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { pricing, site } from "@/lib/config";
import { OFFER_END_LABEL, rupees } from "@/lib/pricing";

export const metadata: Metadata = { title: "Terms & conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Policies" title="Terms & conditions" updated="19 November 2026">
      <p>
        By registering for the {site.name}, the parent/guardian accepts these terms and the{" "}
        <Link href="/rules" className="font-semibold text-indigo-600 underline">
          competition rules
        </Link>
        .
      </p>
      <h2>Registration</h2>
      <ul>
        <li>Details must be accurate. Certificates are issued in the name and spelling provided at registration.</li>
        <li>
          The registration fee is {rupees(pricing.individual.regular)} per student ({rupees(pricing.individual.offer)} under the launch offer for registrations
          made by {OFFER_END_LABEL} 2026) and confirms one exam attempt. The fee shown when you register is the fee you pay.
        </li>
        <li>
          A school registration costs {rupees(pricing.school.regular)} ({rupees(pricing.school.offer)} under the launch offer until {OFFER_END_LABEL} 2026) and
          covers any number of that school&apos;s students. The school confirms it has the consent of each student&apos;s parent or guardian.
        </li>
        <li>Registrations may be cancelled if details are false or payment cannot be verified.</li>
      </ul>
      <h2>Exam</h2>
      <ul>
        <li>The exam is taken online on the participant&apos;s own device and internet connection, during the one-hour slot they booked.</li>
        <li>Unfair means lead to disqualification without refund.</li>
        <li>The organiser may correct scoring errors and update results if a mistake is discovered.</li>
      </ul>
      <h2>Awards</h2>
      <ul>
        <li>Awards are e-certificates. In addition, the Champion (rank 1) of every class receives a surprise gift voucher chosen by the organiser.</li>
        <li>
          Vouchers are sent after the results to the parent&apos;s registered email or mobile number (or through the school, for students it
          registered). We never ask for any payment, OTP or bank details to send them.
        </li>
        <li>Awards cannot be exchanged for cash. Gift vouchers follow the issuing brand&apos;s own terms, such as expiry dates.</li>
        <li>The organiser&apos;s decision on results is final.</li>
      </ul>
      <h2>Liability</h2>
      <p>
        We work hard to keep the website available, but we are not responsible for interruptions caused by the participant&apos;s device, internet
        connection, power cuts or events outside our control.
      </p>
      <h2>Changes</h2>
      <p>We may update dates or rules if necessary and will announce any change on this website.</p>
      <h2>Contact</h2>
      <p>
        {site.organiser} · {site.contact.email} · {site.contact.phone}
      </p>
    </ProsePage>
  );
}
