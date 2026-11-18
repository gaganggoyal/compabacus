import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { Card } from "@/components/ui";
import { AGE_GROUPS, fee, schedule, site } from "@/lib/config";
import { LEVELS, totalQuestions } from "@/lib/exam/levels";
import { fmtDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Rules & syllabus" };

export default function RulesPage() {
  return (
    <ProsePage eyebrow="Rules & syllabus" title="Competition rules">
      <p>
        These rules apply to the {site.name}. By registering, the parent/guardian agrees to them on behalf of the student.
      </p>

      <h2>1. Eligibility</h2>
      <ul>
        <li>Open to students aged 4 to 18 years as on 1 December 2026, from any school, academy or home-learning background.</li>
        <li>Registration fee is ₹{fee.amount} per student, paid by UPI. Each student needs a separate registration and payment.</li>
        <li>Students are placed in an age group automatically from their date of birth and choose their own level.</li>
      </ul>

      <h2>2. Categories</h2>
      <p>Each combination of age group and level is a separate category with its own ranking.</p>
      <ul>
        {AGE_GROUPS.map((g) => (
          <li key={g.id}>
            <strong>Group {g.id}</strong> ({g.label}): ages {g.min}–{g.max}
          </li>
        ))}
      </ul>

      <h2>3. Levels & syllabus</h2>
      <div className="not-prose grid gap-3">
        {LEVELS.map((l) => (
          <Card key={l.id} className="p-5">
            <p className="font-display text-lg font-bold text-ink">
              {l.name} <span className="text-sm text-ink/40">{l.id}</span>
            </p>
            <p className="mt-1 text-sm">{l.description}</p>
            <p className="mt-2 text-sm text-ink/55">
              {l.sections.map((s) => `${s.title}: ${s.count}`).join(" · ")} — {totalQuestions(l)} questions in {l.durationSec / 60} minutes
            </p>
          </Card>
        ))}
      </div>

      <h2>4. Exam window & attempt</h2>
      <ul>
        <li>
          The exam can be started any time between <strong>{fmtDateTime(schedule.examStart)}</strong> and{" "}
          <strong>{fmtDateTime(schedule.examEnd)}</strong> IST.
        </li>
        <li>Each student gets exactly one attempt. Once started, the timer cannot be paused, restarted or extended.</li>
        <li>The paper is submitted automatically when time runs out. Answers saved before the deadline are evaluated.</li>
        <li>Every student receives a unique paper of identical difficulty for their level.</li>
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
        <li>Each correct answer earns 1 mark. There is no negative marking.</li>
        <li>Students are ranked within their category by score (highest first). Ties are broken by the shorter time taken, then by the earlier submission.</li>
        <li>Only students with a verified ₹{fee.amount} payment are ranked.</li>
      </ul>

      <h2>7. Awards</h2>
      <ul>
        <li>
          <strong>Champion, 1st Runner-up, 2nd Runner-up</strong> — ranks 1, 2 and 3 in every category.
        </li>
        <li>
          <strong>Distinction</strong> — 90% or more; <strong>Merit</strong> — 75% or more.
        </li>
        <li>
          <strong>Participation</strong> — every other student who completes the exam.
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
