import { asc, eq, inArray } from "drizzle-orm";
import { currentSchool } from "@/lib/auth";
import { decryptPin } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { gradeLabel } from "@/lib/exam/papers";
import { slotAt, slotDay, slotHours } from "@/lib/slots";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quote, and stop spreadsheet apps from treating a cell as a formula.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** The school's students with their logins, for Excel / Google Sheets. */
export async function GET() {
  const school = await currentSchool();
  if (!school) return new Response("Please log in to your school account.", { status: 401 });
  const students = await db.select().from(schema.registrations).where(eq(schema.registrations.schoolId, school.id)).orderBy(asc(schema.registrations.studentName));
  const attempts = students.length
    ? await db
        .select({ registrationId: schema.attempts.registrationId, status: schema.attempts.status, score: schema.attempts.score, award: schema.attempts.award })
        .from(schema.attempts)
        .where(
          inArray(
            schema.attempts.registrationId,
            students.map((s) => s.id),
          ),
        )
    : [];
  const byReg = new Map(attempts.map((a) => [a.registrationId, a]));
  const rows = [
    ["Registration no", "Student", "Class", "Date of birth", "PIN", "Exam slot (IST)", "Exam status"],
    ...students.map((s) => {
      const slot = slotAt(s.slotStart);
      const a = byReg.get(s.id);
      return [
        s.regNo,
        s.studentName,
        gradeLabel(s.grade),
        s.dob,
        decryptPin(s.pinEnc) ?? "",
        slot ? `${slotDay(slot.start)} ${slotHours(slot)}` : "",
        a ? a.status.replace("_", " ") : "not started",
      ];
    }),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kudoscup-${school.code}-students.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
