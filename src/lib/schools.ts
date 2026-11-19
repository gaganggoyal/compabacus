import "server-only";
import { and, count, eq } from "drizzle-orm";
import { site } from "./config";
import { encryptPin, hashSecret, newId, randomDigits } from "./crypto";
import { db, schema } from "./db";
import type { PaymentStatus, School } from "./db/schema";

/** A school can register this many students. Generous; it only stops runaway mistakes. */
export const MAX_STUDENTS_PER_SCHOOL = 5000;
export const MAX_BULK_ROWS = 300;

/** Students of a school share the school's payment: nothing to pay themselves. */
export async function syncSchoolStudents(schoolId: string, status: PaymentStatus) {
  await db
    .update(schema.registrations)
    .set({
      paymentStatus: status,
      paymentVerifiedAt: status === "verified" ? new Date() : null,
      paymentNote: "Covered by the school's registration",
    })
    .where(eq(schema.registrations.schoolId, schoolId));
}

export async function schoolStudentCount(schoolId: string) {
  const [{ n }] = await db.select({ n: count() }).from(schema.registrations).where(eq(schema.registrations.schoolId, schoolId));
  return n;
}

async function uniqueRegNo() {
  for (let i = 0; i < 20; i++) {
    const candidate = `${site.regPrefix}-${randomDigits(6)}`;
    const taken = await db.query.registrations.findFirst({ where: eq(schema.registrations.regNo, candidate), columns: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error("Could not create a registration number");
}

export async function uniqueSchoolCode() {
  for (let i = 0; i < 20; i++) {
    const candidate = `${site.schoolPrefix}-${randomDigits(5)}`;
    const taken = await db.query.schools.findFirst({ where: eq(schema.schools.code, candidate), columns: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error("Could not create a school code");
}

export type NewStudent = {
  studentName: string;
  dob: string;
  grade: string;
  gender?: string | null;
  parentName?: string | null;
  phone?: string | null;
  email?: string | null;
};

/** Adds students to a school. Each gets a registration number and a random 6-digit PIN the school can print. */
export async function createSchoolStudents(school: School, rows: NewStudent[]) {
  const now = new Date();
  const added: { id: string; regNo: string; name: string; pin: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];
  const existing = await db
    .select({ name: schema.registrations.studentName, dob: schema.registrations.dob, regNo: schema.registrations.regNo })
    .from(schema.registrations)
    .where(eq(schema.registrations.schoolId, school.id));
  const seen = new Map(existing.map((e) => [`${e.name.toLowerCase()}|${e.dob}`, e.regNo]));

  for (let i = 0; i < rows.length; i += 8) {
    const chunk = rows.slice(i, i + 8);
    const prepared = await Promise.all(
      chunk.map(async (row) => {
        const key = `${row.studentName.toLowerCase()}|${row.dob}`;
        if (seen.has(key)) return { skip: { name: row.studentName, reason: `already added (${seen.get(key)})` } };
        seen.set(key, "this list");
        const pin = randomDigits(6);
        return { row, pin, pinHash: await hashSecret(pin), regNo: await uniqueRegNo() };
      }),
    );
    for (const p of prepared) {
      if ("skip" in p) {
        skipped.push(p.skip!);
        continue;
      }
      const id = newId();
      try {
        await db.insert(schema.registrations).values({
          id,
          regNo: p.regNo,
          studentName: p.row.studentName,
          dob: p.row.dob,
          gender: p.row.gender || null,
          grade: p.row.grade,
          school: school.name,
          parentName: p.row.parentName || "Parent / guardian",
          phone: p.row.phone || school.phone,
          email: p.row.email || null,
          city: school.city,
          state: school.state,
          country: "India",
          pinHash: p.pinHash,
          pinEnc: encryptPin(p.pin),
          feeAmount: 0,
          schoolId: school.id,
          paymentStatus: school.paymentStatus,
          paymentVerifiedAt: school.paymentStatus === "verified" ? now : null,
          paymentNote: "Covered by the school's registration",
          consentAt: now,
          createdAt: now,
        });
        added.push({ id, regNo: p.regNo, name: p.row.studentName, pin: p.pin });
      } catch {
        skipped.push({ name: p.row.studentName, reason: "could not be saved, please try again" });
      }
    }
  }
  return { added, skipped };
}

/** The school's own student, or null. */
export async function schoolStudent(schoolId: string, registrationId: string) {
  return (
    (await db.query.registrations.findFirst({
      where: and(eq(schema.registrations.id, registrationId), eq(schema.registrations.schoolId, schoolId)),
    })) ?? null
  );
}
