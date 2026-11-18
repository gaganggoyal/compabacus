import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { fee, site } from "@/lib/config";

export const metadata: Metadata = { title: "Refund policy" };

export default function RefundPage() {
  return (
    <ProsePage eyebrow="Policies" title="Refund policy" updated="18 November 2026">
      <p>The registration fee is ₹{fee.amount} per student. Because the fee is symbolic and confirms an exam seat, it is generally non-refundable.</p>
      <h2>When we refund</h2>
      <ul>
        <li>You paid twice for the same student (duplicate payment).</li>
        <li>You paid but could not register because of an error on our website.</li>
        <li>The competition is cancelled by us.</li>
      </ul>
      <h2>When we don&apos;t refund</h2>
      <ul>
        <li>The student did not take the exam within the exam window.</li>
        <li>The attempt was disqualified for unfair means.</li>
        <li>Problems with the participant&apos;s own device or internet.</li>
      </ul>
      <h2>How to request</h2>
      <p>
        Write to {site.contact.email} or WhatsApp {site.contact.phone} with the registration number and UPI reference within 15 days of payment.
        Approved refunds are sent back to the same UPI account within 7 working days.
      </p>
    </ProsePage>
  );
}
