import { schedule, slotRules } from "./config";

/**
 * The December exam timetable. Each day offers a different set of one-hour slots: evenings on school days,
 * more choice at weekends and on Christmas. The mix is generated from a fixed seed, so it never changes
 * between deploys. Safe for client components.
 */
export type Slot = {
  /** "2026-12-05T18" (IST date and start hour) */
  id: string;
  /** "2026-12-05" */
  day: string;
  start: number;
  end: number;
};

export type ScheduleDay = { day: string; weekday: number; slots: Slot[] };

const SLOT_MS = slotRules.minutes * 60 * 1000;
/** Booking closes 10 minutes before a slot ends. */
export const BOOKING_CUTOFF_MS = 10 * 60 * 1000;

const SCHOOL_DAY = { always: [18], extra: [7, 16, 17, 19, 20], pick: [2, 4] };
const HOLIDAY = { always: [10, 17], extra: [8, 9, 11, 12, 14, 15, 16, 18, 19, 20], pick: [4, 6] };
const HOLIDAYS = new Set(["2026-12-25"]);

function seeded(seed: string) {
  let a = 2166136261;
  for (const c of seed) a = Math.imul(a ^ c.charCodeAt(0), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSchedule(): ScheduleDay[] {
  const [y, m, d] = schedule.examStart.slice(0, 10).split("-").map(Number);
  const last = schedule.examEnd.slice(0, 10);
  const windowStart = Date.parse(schedule.examStart);
  const windowEnd = Date.parse(schedule.examEnd);
  const days: ScheduleDay[] = [];
  for (let t = Date.UTC(y, m - 1, d); ; t += 86_400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    if (day > last) break;
    const weekday = new Date(t).getUTCDay();
    const rule = weekday === 0 || weekday === 6 || HOLIDAYS.has(day) ? HOLIDAY : SCHOOL_DAY;
    const rand = seeded(`kudoscup-${day}`);
    const pool = [...rule.extra];
    const count = rule.pick[0] + Math.floor(rand() * (rule.pick[1] - rule.pick[0] + 1));
    const hours = [...rule.always];
    while (hours.length < rule.always.length + count && pool.length) hours.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    const slots = hours
      .sort((a, b) => a - b)
      .map((h) => {
        const hh = String(h).padStart(2, "0");
        const start = Date.parse(`${day}T${hh}:00:00+05:30`);
        return { id: `${day}T${hh}`, day, start, end: start + SLOT_MS };
      })
      .filter((s) => s.start >= windowStart && s.end <= windowEnd);
    days.push({ day, weekday, slots });
  }
  return days;
}

export const SCHEDULE = buildSchedule();
export const ALL_SLOTS = SCHEDULE.flatMap((d) => d.slots);
const BY_ID = new Map(ALL_SLOTS.map((s) => [s.id, s]));
const BY_START = new Map(ALL_SLOTS.map((s) => [s.start, s]));

export function slotById(id: string) {
  return BY_ID.get(id);
}

/** A booked slot, looked up by its start time (what registrations store). */
export function slotAt(start: Date | number | null | undefined): Slot | undefined {
  if (start == null) return undefined;
  const ms = typeof start === "number" ? start : start.getTime();
  return BY_START.get(ms) ?? { id: `custom-${ms}`, day: new Date(ms + 5.5 * 3_600_000).toISOString().slice(0, 10), start: ms, end: ms + SLOT_MS };
}

export type SlotState = "open" | "filling" | "full" | "closed";

export function slotState(slot: Slot, booked: number, now: number): SlotState {
  if (now > slot.end - BOOKING_CUTOFF_MS) return "closed";
  if (booked >= slotRules.capacity) return "full";
  if (booked >= slotRules.capacity * slotRules.fillingFastAt) return "filling";
  return "open";
}

export function seatsLeft(booked: number) {
  return Math.max(0, slotRules.capacity - booked);
}

const IST = "Asia/Kolkata";
const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long" });

/** "6:00 pm" */
export function slotTime(ms: number) {
  return timeFmt.format(ms).replace(/\s?([ap])\.?m\.?/i, " $1m").toLowerCase();
}

/** "6:00 pm – 7:00 pm" */
export function slotHours(slot: Slot) {
  return `${slotTime(slot.start)} – ${slotTime(slot.end)}`;
}

/** "Sat, 5 Dec" */
export function slotDay(ms: number) {
  return dayFmt.format(ms);
}

/** "Saturday, 5 December, 6:00 pm – 7:00 pm IST" */
export function slotLabel(slot: Slot) {
  return `${longDayFmt.format(slot.start)}, ${slotHours(slot)} IST`;
}

/** A Google Calendar link so parents can set their own reminder. */
export function calendarLink(slot: Slot, title: string, details: string) {
  const z = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${z(slot.start)}/${z(slot.end)}`, details });
  return `https://calendar.google.com/calendar/render?${q.toString().replace("%2F", "/")}`;
}
