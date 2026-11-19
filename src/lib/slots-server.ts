import "server-only";
import { and, count, eq, isNotNull, ne, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { slotRules } from "./config";
import { db, schema } from "./db";
import { ALL_SLOTS, type Slot, slotState } from "./slots";

/** Booked seats per slot start time, straight from the database (use for booking decisions). */
export async function bookedCounts() {
  const rows = await db
    .select({ start: schema.registrations.slotStart, n: count() })
    .from(schema.registrations)
    .where(isNotNull(schema.registrations.slotStart))
    .groupBy(schema.registrations.slotStart);
  const map: Record<string, number> = {};
  for (const r of rows) if (r.start) map[r.start.getTime()] = r.n;
  return map;
}

/** The same counts for public pages, refreshed every minute so busy pages stay fast. `asOf` is when they were counted. */
export async function availabilitySnapshot() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  return { counts: await bookedCounts(), asOf: Date.now() };
}

/** Books (or moves) a student's slot. Atomic: the seat count is checked inside the same UPDATE. */
export async function bookSlot(registrationId: string, slot: Slot, now: number): Promise<{ ok: true } | { error: string }> {
  const counts = await bookedCounts();
  const state = slotState(slot, counts[slot.start] ?? 0, now);
  if (state === "closed") return { error: "This slot has already started or ended. Please pick a later one." };
  if (state === "full") return { error: "Sorry, this slot just filled up. Please pick another one." };
  const res = await db
    .update(schema.registrations)
    .set({ slotStart: new Date(slot.start), slotBookedAt: new Date(now) })
    .where(
      and(
        eq(schema.registrations.id, registrationId),
        sql`(select count(*) from ${schema.registrations} r2 where r2.slot_start = ${slot.start} and r2.id != ${registrationId}) < ${slotRules.capacity}`,
      ),
    );
  if (!res.rowsAffected) return { error: "Sorry, this slot just filled up. Please pick another one." };
  return { ok: true };
}

/** For the organiser panel: every slot with its bookings. */
export async function slotOverview() {
  const counts = await bookedCounts();
  return ALL_SLOTS.map((s) => ({ slot: s, booked: counts[s.start] ?? 0 }));
}

/** Students booked into a slot (organiser panel). */
export async function studentsInSlot(start: number) {
  return db
    .select({ id: schema.registrations.id, regNo: schema.registrations.regNo, name: schema.registrations.studentName, grade: schema.registrations.grade })
    .from(schema.registrations)
    .where(and(eq(schema.registrations.slotStart, new Date(start)), ne(schema.registrations.paymentStatus, "unpaid")));
}
