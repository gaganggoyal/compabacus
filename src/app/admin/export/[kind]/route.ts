import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { GRADES, gradeLabel } from "@/lib/exam/papers";
import { AWARD_META } from "@/lib/format";
import { isAdmin } from "@/lib/session";

function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = v == null ? "" : String(v);
          // Neutralise spreadsheet formula injection.
          if (/^[=+\-@]/.test(s)) s = `'${s}`;
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export async function GET(_req: Request, ctx: RouteContext<"/admin/export/[kind]">) {
  if (!(await isAdmin())) return new Response("Unauthorised", { status: 401 });
  const { kind } = await ctx.params;
  let body: string;

  if (kind === "registrations") {
    const rows = await db.select().from(schema.registrations).orderBy(desc(schema.registrations.createdAt));
    const schools = new Map((await db.select({ id: schema.schools.id, code: schema.schools.code }).from(schema.schools)).map((x) => [x.id, x.code]));
    body = csv([
      ["reg_no", "student", "dob", "gender", "class", "school", "school_code", "parent", "phone", "email", "city", "state", "country", "fee_inr", "payment", "utr", "slot_start_ist", "registered_at"],
      ...rows.map((r) => [
        r.regNo,
        r.studentName,
        r.dob,
        r.gender,
        gradeLabel(r.grade),
        r.school,
        r.schoolId ? (schools.get(r.schoolId) ?? "") : "",
        r.parentName,
        r.phone,
        r.email,
        r.city,
        r.state,
        r.country,
        r.feeAmount,
        r.paymentStatus,
        r.utr,
        r.slotStart ? new Date(r.slotStart.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 16).replace("T", " ") : "",
        r.createdAt.toISOString(),
      ]),
    ]);
  } else if (kind === "results") {
    const rows = await db
      .select({ a: schema.attempts, r: schema.registrations })
      .from(schema.attempts)
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId));
    const order = (id: string) => GRADES.findIndex((g) => g.id === id);
    rows.sort((x, y) => order(x.a.grade) - order(y.a.grade) || (x.a.rank ?? 1e9) - (y.a.rank ?? 1e9));
    const schools = new Map((await db.select({ id: schema.schools.id, code: schema.schools.code }).from(schema.schools)).map((x) => [x.id, x.code]));
    body = csv([
      ["class", "rank", "award", "gift_voucher", "student", "reg_no", "parent", "phone", "email", "school_code", "city", "state", "score", "max", "time_sec", "screen_exits", "status", "payment", "cert_no"],
      ...rows.map(({ a, r }) => [
        gradeLabel(a.grade),
        a.rank,
        a.award ? AWARD_META[a.award].label : "",
        a.award === "champion" ? "yes" : "",
        r.studentName,
        r.regNo,
        r.parentName,
        r.phone,
        r.email,
        r.schoolId ? (schools.get(r.schoolId) ?? "") : "",
        r.city,
        r.state,
        a.score,
        a.maxScore,
        a.timeTakenMs != null ? Math.round(a.timeTakenMs / 1000) : "",
        a.focusLosses,
        a.status,
        r.paymentStatus,
        a.certNo,
      ]),
    ]);
  } else {
    return new Response("Not found", { status: 404 });
  }

  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
