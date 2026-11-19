import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { Card } from "@/components/ui";
import { pricing, schedule, site, slotRules, toppersReward } from "@/lib/config";
import { GRADES, STAGES, describeSection, totalQuestions } from "@/lib/exam/papers";
import { fmtDateTime } from "@/lib/format";
import { OFFER_END_LABEL, rupees } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Rules & syllabus",
  description: `Rules, class-wise syllabus, exam slots, scoring and awards of the ${site.name}.`,
  alternates: { canonical: "/rules" },
};

export default function RulesPage() {
  return (
    <ProsePage eyebrow="Rules & syllabus" title="Competition rules">
      <p>
        These rules apply to the {site.name}. By registering, the parent/guardian agrees to them on behalf of the student.
      </p>

      <h2>1. Eligibility</h2>
      <ul>
        <li>Open to students aged 4 to 18 years as on 1 December 2026, from any school, academy or home-learning background.</li>
        <li>
          Registration fee: {rupees(pricing.individual.regular)} per student, or {rupees(pricing.individual.offer)} with the launch offer for
          registrations made by {OFFER_END_LABEL} 2026. Paid by UPI; each student needs a separate registration and payment.
        </li>
        <li>
          Schools can instead register any number of students for one school fee of {rupees(pricing.school.regular)} ({rupees(pricing.school.offer)} with the
          launch offer until {OFFER_END_LABEL}). Students registered by a school pay nothing themselves.
        </li>
        <li>Students compete in their school class for the current session (Nursery to Class 12). Each class accepts a sensible age range, shown below, so that no child takes an easier paper than their class.</li>
      </ul>

      <h2>2. Categories</h2>
      <p>Every class is a separate category with its own paper and its own ranking: {STAGES.map((s) => `${s.label} (${s.short})`).join(", ")}.</p>

      <h2>3. Syllabus by class</h2>
      <p>Every question is multiple choice with four options, one of which is correct.</p>
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        {GRADES.map((g) => (
          <Card key={g.id} className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg font-bold text-ink">{g.label}</p>
              <p className="text-xs font-semibold text-ink/45">
                Ages {g.ages[0]}–{g.ages[1]}
              </p>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-ink/70">
              {g.paper.sections.map((s) => (
                <li key={s.id}>
                  <b className="text-ink/80">{s.count}×</b> {describeSection(s)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink/55">
              {totalQuestions(g.paper)} questions in {g.paper.durationSec / 60} minutes
            </p>
          </Card>
        ))}
      </div>

      <h2>4. Exam slots & attempt</h2>
      <ul>
        <li>
          The exam runs between <strong>{fmtDateTime(schedule.examStart)}</strong> and <strong>{fmtDateTime(schedule.examEnd)}</strong> IST, in
          one-hour slots. After paying, each student books one slot ({slotRules.capacity} seats per slot, first come, first served).
        </li>
        <li>The exam can only be started during the booked slot. A student who misses their slot may book another open slot before the window closes.</li>
        <li>A slot can be changed any time before the exam is started.</li>
        <li>Each student gets exactly one attempt. Once started, the timer cannot be paused, restarted or extended.</li>
        <li>The paper is submitted automatically when time runs out. Answers saved before the deadline are evaluated.</li>
        <li>Every student receives a unique paper of identical difficulty for their class, with the options in a different order.</li>
        <li>Answers can be changed any time until the paper is submitted.</li>
      </ul>

      <h2>5. Conduct & fair play</h2>
      <ul>
        <li>A physical abacus may be used for written sections. The Flash Round must be done mentally.</li>
        <li>Calculators, phones/apps for calculation, internet search, or help from any person are not allowed.</li>
        <li>Leaving the exam screen is recorded. Repeated switching, unusual answer patterns or any evidence of unfair means may lead to disqualification after review.</li>
        <li>The organiser&apos;s decision on disqualification and results is final.</li>
      </ul>

      <h2>6. Scoring & ranking</h2>
      <ul>
        <li>Each correct answer earns 1 mark. There is no negative marking, and an unanswered question scores zero.</li>
        <li>Students are ranked within their class by score (highest first). Ties are broken by the shorter time taken, then by the earlier submission.</li>
        <li>Only students with a verified payment (their own, or their school&apos;s) are ranked.</li>
      </ul>

      <h2>7. Awards</h2>
      <ul>
        <li>
          <strong>Champion, 1st Runner-up, 2nd Runner-up</strong> — ranks 1, 2 and 3 in every class.
        </li>
        <li>
          <strong>Distinction</strong> — 90% or more; <strong>Merit</strong> — 75% or more.
        </li>
        <li>
          <strong>Participation</strong> — every other student who completes the exam.
        </li>
        <li>
          <strong>Surprise gift voucher</strong> — the Champion (rank 1) of every class also wins a gift voucher chosen by us.{" "}
          {toppersReward.delivery}
        </li>
        <li>All certificates are digital, carry a unique number and a QR code for verification.</li>
      </ul>

      <h2>8. Results</h2>
      <p>
        Results will be published on <strong>{fmtDateTime(schedule.resultsAt)}</strong> IST on this website. Winners&apos; first name, last
        initial, city and state are shown publicly in the Hall of Fame.
      </p>

      <h2>9. Technical issues</h2>
      <p>
        If a genuine technical problem on our side prevents a student from completing the exam, contact us within 24 hours. We may, at our
        discretion, allow a fresh attempt. Problems with the participant&apos;s own device or internet connection are not grounds for a re-test.
      </p>
    </ProsePage>
  );
}
