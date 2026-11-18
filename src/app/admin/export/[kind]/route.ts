import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
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
    body = csv([
      ["reg_no", "student", "dob", "gender", "age_group", "level", "school", "parent", "phone", "email", "city", "state", "country", "payment", "utr", "registered_at"],
      ...rows.map((r) => [
        r.regNo,
        r.studentName,
        r.dob,
        r.gender,
        r.ageGroup,
        r.level,
        r.school,
        r.parentName,
        r.phone,
        r.email,
        r.city,
        r.state,
        r.country,
        r.paymentStatus,
        r.utr,
        r.createdAt.toISOString(),
      ]),
    ]);
  } else if (kind === "results") {
    const rows = await db
      .select({ a: schema.attempts, r: schema.registrations })
      .from(schema.attempts)
      .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId));
    rows.sort((x, y) => (x.a.ageGroup + x.a.level).localeCompare(y.a.ageGroup + y.a.level) || (x.a.rank ?? 1e9) - (y.a.rank ?? 1e9));
    body = csv([
      ["age_group", "level", "rank", "award", "student", "reg_no", "city", "state", "phone", "score", "max", "time_sec", "screen_exits", "status", "payment", "cert_no"],
      ...rows.map(({ a, r }) => [
        a.ageGroup,
        a.level,
        a.rank,
        a.award ? AWARD_META[a.award].label : "",
        r.studentName,
        r.regNo,
        r.city,
        r.state,
        r.phone,
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
