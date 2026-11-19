import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { schoolBookSlotFormAction } from "@/app/actions/school";
import { SlotPicker } from "@/components/slots/slot-picker";
import { PageLoading } from "@/components/ui";
import { currentSchool } from "@/lib/auth";
import { gradeLabel } from "@/lib/exam/papers";
import { attemptFor } from "@/lib/exam/server";
import { requestNow } from "@/lib/now";
import { schoolStudent } from "@/lib/schools";
import { slotAt, slotLabel } from "@/lib/slots";
import { bookedCounts } from "@/lib/slots-server";
import { canBookSlot } from "@/lib/student-view";

export const metadata: Metadata = { title: "Book a slot", robots: { index: false } };

export default function SchoolSlotPage({ searchParams }: PageProps<"/schools/dashboard/slot">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <BookForStudent searchParams={searchParams} />
    </Suspense>
  );
}

async function BookForStudent({ searchParams }: { searchParams: PageProps<"/schools/dashboard/slot">["searchParams"] }) {
  const now = await requestNow();
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  const { student } = await searchParams;
  const reg = typeof student === "string" ? await schoolStudent(school.id, student) : null;
  if (!reg) notFound();
  const attempt = await attemptFor(reg.id);
  const current = slotAt(reg.slotStart);

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/schools/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> School dashboard
      </Link>
      <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Exam slot for {reg.studentName}</h1>
      <p className="mt-2 text-ink/60">
        {gradeLabel(reg.grade)} · {reg.regNo}
        {current && <> · booked: {slotLabel(current)}</>}
      </p>
      <div className="mt-8">
        {canBookSlot(reg, attempt, now) ? (
          <SlotPicker
            counts={await bookedCounts()}
            asOf={now}
            current={current?.id}
            action={schoolBookSlotFormAction.bind(null, reg.id)}
            submitLabel={current ? "Move to" : "Book"}
          />
        ) : (
          <p className="max-w-xl rounded-2xl bg-amber-50 px-5 py-4 text-amber-900">
            {attempt ? "This student has already started the exam, so the slot can't change." : "Submit the school payment first, then book slots."}
          </p>
        )}
      </div>
    </div>
  );
}
