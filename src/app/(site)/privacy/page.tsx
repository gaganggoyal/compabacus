import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Policies" title="Privacy policy" updated="19 November 2026">
      <p>
        {site.organiser} (&ldquo;we&rdquo;) runs the {site.name}. Most participants are children, so we collect as little as possible and only
        with a parent&apos;s or guardian&apos;s consent.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Student: name, date of birth, optional gender, optional school/academy, and school class.</li>
        <li>Parent/guardian: name, mobile number, email, city and state.</li>
        <li>Payment: the UPI transaction reference you enter. We never see or store card, bank or UPI PIN details.</li>
        <li>Exam: answers, timing, and how often the exam screen was left.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To register the student, verify payment, place them in the right category, conduct the exam and publish results.</li>
        <li>To issue certificates and let anyone verify them.</li>
        <li>
          To email the parent about this competition: the registration number, payment confirmation, exam confirmation, results and PIN resets. We
          do not send marketing without separate permission.
        </li>
      </ul>
      <h2>What is public</h2>
      <p>
        For students who finish in the top 3 of a category, we show first name, last initial, city, state, score and time in the Hall of Fame. The
        certificate verification page shows the full name, city, award and score for a certificate number.
      </p>
      <h2>Sharing</h2>
      <p>
        We do not sell or rent personal data. Data is stored on our own server, and emails are delivered through our email provider (Resend), only
        to run this competition.
      </p>
      <h2>Retention</h2>
      <p>
        We keep registration and exam data until 30 June 2027 to handle queries and certificate verification, then delete it — except winners&apos;
        names and results, which are kept as an archive.
      </p>
      <h2>Your rights</h2>
      <p>
        A parent/guardian can ask us to see, correct or delete their child&apos;s data, or withdraw consent, by writing to {site.contact.email}.
        Deleting data before results removes the student from the competition.
      </p>
      <h2>Contact</h2>
      <p>
        {site.organiser}, {site.contact.city} · {site.contact.email} · {site.contact.phone}
      </p>
    </ProsePage>
  );
}
