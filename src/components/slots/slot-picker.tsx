"use client";

import { CalendarCheck, Clock } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { slotRules } from "@/lib/config";
import { SCHEDULE, type SlotState, seatsLeft, slotDay, slotHours, slotState, slotTime } from "@/lib/slots";
import { btn, cn } from "../ui";

type ActionState = { ok?: boolean; message?: string };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOT: Record<SlotState | "none", string> = {
  open: "bg-emerald-500",
  filling: "bg-amber-500",
  full: "bg-rose-400",
  closed: "bg-ink/20",
  none: "bg-transparent",
};

function bestState(states: SlotState[]): SlotState | "none" {
  if (!states.length) return "none";
  for (const s of ["open", "filling", "full"] as const) if (states.includes(s)) return s;
  return "closed";
}

/**
 * December calendar with the one-hour exam slots of each day and the seats left in each.
 * Seat counts are real bookings. With an `action`, it becomes a booking form (hidden input "slot").
 */
export function SlotPicker({
  counts,
  asOf,
  current,
  action,
  submitLabel = "Book this slot",
  compact,
}: {
  counts: Record<string, number>;
  /** Server time the counts are from; the browser clock takes over after mount. */
  asOf: number;
  /** Id of the slot already booked, if any. */
  current?: string | null;
  action?: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(asOf);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  const days = useMemo(
    () =>
      SCHEDULE.map((d) => {
        const slots = d.slots.map((s) => {
          const booked = counts[s.start] ?? 0;
          return { ...s, booked, state: slotState(s, booked, now) };
        });
        return { ...d, slots, state: bestState(slots.map((s) => s.state)) };
      }),
    [counts, now],
  );

  const firstOpen = days.find((d) => d.slots.some((s) => s.state === "open" || s.state === "filling"));
  const currentDay = current ? days.find((d) => d.slots.some((s) => s.id === current)) : undefined;
  const [day, setDay] = useState(currentDay?.day ?? firstOpen?.day ?? days[0]?.day);
  const [picked, setPicked] = useState<string | null>(current ?? null);
  const selected = days.find((d) => d.day === day) ?? days[0];
  const pickedSlot = days.flatMap((d) => d.slots).find((s) => s.id === picked);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action ?? (async (s) => s), {});

  const offset = (days[0].weekday + 6) % 7; // Monday-first grid
  const openDays = days.filter((d) => d.state === "open" || d.state === "filling").length;
  const openSeats = days.flatMap((d) => d.slots).reduce((n, s) => n + (s.state === "open" || s.state === "filling" ? seatsLeft(s.booked) : 0), 0);

  return (
    <div className={cn("grid gap-5", !compact && "lg:grid-cols-[1.15fr_1fr]")}>
      <div className="rounded-3xl bg-white p-4 ring-1 ring-ink/8 sm:p-5">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="font-display text-lg font-bold">December 2026</p>
          <p className="text-xs font-semibold text-ink/50">
            {openDays} days · {openSeats.toLocaleString("en-IN")} seats open
          </p>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-ink/40">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {days.map((d) => {
            const usable = d.state === "open" || d.state === "filling";
            const active = d.day === selected.day;
            const mine = d.slots.some((s) => s.id === current);
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setDay(d.day)}
                aria-pressed={active}
                aria-label={`${slotDay(Date.parse(`${d.day}T12:00:00+05:30`))}: ${d.slots.length} slots`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-bold transition sm:rounded-2xl",
                  active ? "bg-ink text-white shadow-lg shadow-ink/20" : usable ? "bg-indigo-50/70 text-ink hover:bg-indigo-100" : "bg-ink/3 text-ink/35",
                )}
              >
                {Number(d.day.slice(8))}
                <span className="mt-1 flex items-center gap-0.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", DOT[d.state], active && d.state === "closed" && "bg-white/40")} />
                  <span className={cn("text-[9px] font-semibold", active ? "text-white/70" : "text-ink/45")}>{d.slots.length}</span>
                </span>
                {mine && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" title="Your slot" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] font-semibold text-ink/50">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Seats open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Filling fast
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Full
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink/20" /> Closed
          </span>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 ring-1 ring-ink/8 sm:p-5">
        <p className="flex items-center gap-2 px-1 font-display text-lg font-bold">
          <CalendarCheck className="h-5 w-5 text-indigo-600" /> {slotDay(Date.parse(`${selected.day}T12:00:00+05:30`))}
        </p>
        <p className="px-1 text-xs text-ink/50">
          One-hour slots · {slotRules.capacity} seats each · all times IST
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {selected.slots.map((s) => {
            const usable = s.state === "open" || s.state === "filling";
            const isPicked = picked === s.id;
            const isMine = current === s.id;
            const left = seatsLeft(s.booked);
            const content = (
              <>
                <span className="flex items-center gap-2 font-display text-base font-bold">
                  <Clock className="h-4 w-4 opacity-60" /> {slotTime(s.start)}
                  {isMine && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">Yours</span>}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    s.state === "filling" ? "text-amber-700" : s.state === "full" ? "text-rose-600" : s.state === "closed" ? "text-ink/40" : "text-emerald-700",
                  )}
                >
                  {s.state === "open" && `${left} seats left`}
                  {s.state === "filling" && `Filling fast · ${left} left`}
                  {s.state === "full" && "Full"}
                  {s.state === "closed" && "Closed"}
                </span>
              </>
            );
            return (
              <li key={s.id}>
                {action ? (
                  <button
                    type="button"
                    disabled={!usable}
                    onClick={() => setPicked(s.id)}
                    aria-pressed={isPicked}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition",
                      isPicked ? "bg-indigo-600 text-white ring-indigo-600 [&_span]:text-white" : usable ? "bg-white ring-ink/10 hover:ring-indigo-400" : "bg-ink/3 ring-ink/5 opacity-70",
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={cn("flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1", usable ? "ring-ink/10" : "bg-ink/3 ring-ink/5")}>{content}</div>
                )}
              </li>
            );
          })}
          {!selected.slots.length && <li className="text-sm text-ink/50">No slots on this day.</li>}
        </ul>

        {action && (
          <form action={formAction} className="mt-5 space-y-3">
            <input type="hidden" name="slot" value={picked ?? ""} />
            {state.message && (
              <p className={cn("rounded-xl px-4 py-3 text-sm font-medium", state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>{state.message}</p>
            )}
            <button type="submit" disabled={pending || !pickedSlot || picked === current} className={cn(btn("primary", "lg"), "w-full")}>
              {pending
                ? "Booking…"
                : pickedSlot && picked !== current
                  ? `${submitLabel}: ${slotDay(pickedSlot.start)}, ${slotHours(pickedSlot)}`
                  : current
                    ? "Pick a different slot to change it"
                    : "Pick a time above"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
