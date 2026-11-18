import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";
import { fee, site } from "@/lib/config";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Policies" title="Terms & conditions" updated="18 November 2026">
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
        <li>The registration fee is ₹{fee.amount} per student and confirms one exam attempt.</li>
        <li>Registrations may be cancelled if details are false or payment cannot be verified.</li>
      </ul>
      <h2>Exam</h2>
      <ul>
        <li>The exam is taken online on the participant&apos;s own device and internet connection.</li>
        <li>Unfair means lead to disqualification without refund.</li>
        <li>The organiser may correct scoring errors and update results if a mistake is discovered.</li>
      </ul>
      <h2>Awards</h2>
      <ul>
        <li>All awards are e-certificates unless announced otherwise. Awards have no cash value and are not transferable.</li>
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
