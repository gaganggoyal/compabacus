import { Suspense } from "react";
import { PageLoading, cn } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { slotRules } from "@/lib/config";
import { requestNow } from "@/lib/now";
import { SCHEDULE, slotDay, slotState, slotTime } from "@/lib/slots";
import { slotOverview } from "@/lib/slots-server";

export default function AdminSlotsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Slots />
    </Suspense>
  );
}

async function Slots() {
  await requireAdmin();
  const now = await requestNow();
  const overview = await slotOverview();
  const byId = new Map(overview.map((o) => [o.slot.id, o.booked]));
  const total = overview.reduce((a, o) => a + o.booked, 0);
  const busiest = [...overview].sort((a, b) => b.booked - a.booked).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Exam slots</h1>
        <p className="mt-1 text-sm text-ink/55">
          {overview.length} slots · {slotRules.capacity} seats each · {total} booked. Students can only start the exam during their booked hour.
        </p>
        {busiest[0]?.booked ? (
          <p className="mt-2 text-sm text-ink/55">
            Busiest: {busiest.filter((b) => b.booked).map((b) => `${slotDay(b.slot.start)} ${slotTime(b.slot.start)} (${b.booked})`).join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SCHEDULE.map((d) => (
          <div key={d.day} className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
            <p className="font-display font-bold">{slotDay(Date.parse(`${d.day}T12:00:00+05:30`))}</p>
            <ul className="mt-2 space-y-1.5">
              {d.slots.map((s) => {
                const booked = byId.get(s.id) ?? 0;
                const state = slotState(s, booked, now);
                const pct = Math.min(100, (booked / slotRules.capacity) * 100);
                return (
                  <li key={s.id} className="text-xs">
                    <div className="flex justify-between">
                      <span className={cn("font-semibold", state === "closed" && "text-ink/40")}>{slotTime(s.start)}</span>
                      <span className="tabular-nums text-ink/60">
                        {booked}/{slotRules.capacity}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-ink/[0.06]">
                      <div className={cn("h-1.5 rounded-full", state === "full" ? "bg-rose-500" : state === "filling" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
