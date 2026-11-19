import { ArrowLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { bookSlotAction } from "@/app/actions/student";
import { SlotPicker } from "@/components/slots/slot-picker";
import { Card, PageLoading, btn, cn } from "@/components/ui";
import { currentStudent } from "@/lib/auth";
import { slotRules } from "@/lib/config";
import { requestNow } from "@/lib/now";
import { slotAt, slotLabel } from "@/lib/slots";
import { bookedCounts } from "@/lib/slots-server";
import { canBookSlot, freshAttempt, isPaid } from "@/lib/student-view";

export const metadata: Metadata = { title: "Book your exam slot", robots: { index: false } };

export default function SlotPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <BookSlot />
    </Suspense>
  );
}

async function BookSlot() {
  const now = await requestNow();
  const reg = await currentStudent();
  if (!reg) redirect("/login?next=/dashboard/slot");
  const attempt = await freshAttempt(reg, now);
  const current = slotAt(reg.slotStart);

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <div className="mt-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Step 3 of 3</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">{current ? "Your exam slot" : "Book your exam slot"}</h1>
        <p className="mt-3 text-ink/65">
          Pick a one-hour slot in December. {reg.studentName.split(" ")[0]} can start the exam any time during that hour. Missed it? Come back and book
          another open slot.
        </p>
        {current && (
          <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 ring-1 ring-emerald-100">Booked: {slotLabel(current)}</p>
        )}
      </div>

      {!isPaid(reg) ? (
        <Card className="mt-8 max-w-xl p-8">
          <p className="font-display text-2xl font-bold">Payment first</p>
          <p className="mt-2 text-ink/65">Submit your payment, then come back here to book a slot.</p>
          <Link href="/dashboard/payment" className={cn(btn("primary"), "mt-6")}>
            Go to payment
          </Link>
        </Card>
      ) : !canBookSlot(reg, attempt, now) ? (
        <Card className="mt-8 max-w-xl p-8">
          <p className="font-display text-2xl font-bold">{attempt ? "Your exam has started" : "Slot booking is closed"}</p>
          <p className="mt-2 text-ink/65">{attempt ? "The slot can't be changed once the exam has started." : "The exam window has closed."}</p>
          <Link href="/dashboard" className={cn(btn("primary"), "mt-6")}>
            Back to dashboard
          </Link>
        </Card>
      ) : (
        <div className="mt-8">
          <SlotPicker counts={await bookedCounts()} asOf={now} current={current?.id} action={bookSlotAction} submitLabel={current ? "Move to" : "Book"} />
          <p className="mt-5 flex max-w-2xl items-start gap-2 text-sm text-ink/55">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> Each slot has {slotRules.capacity} seats. Seat counts are live bookings. We email the parent a confirmation
            with an &ldquo;Add to calendar&rdquo; link.
          </p>
        </div>
      )}
    </div>
  );
}
