import { type SQL, and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { AttemptActions } from "@/components/admin/admin-forms";
import { Badge, PageLoading, cn } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { finalizeExpiredAttempts } from "@/lib/exam/server";
import { gradeLabel } from "@/lib/exam/papers";
import { fmtDateTime, fmtDuration } from "@/lib/format";

export default function AttemptsPage({ searchParams }: PageProps<"/admin/attempts">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Attempts searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "flagged", label: "Flagged" },
  { id: "in_progress", label: "In progress" },
  { id: "disqualified", label: "Disqualified" },
] as const;

async function Attempts({ searchParams }: { searchParams: PageProps<"/admin/attempts">["searchParams"] }) {
  await requireAdmin();
  await finalizeExpiredAttempts(await requestNow());
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" ? sp.filter : "all";

  const where: SQL[] = [];
  if (filter === "flagged") where.push(eq(schema.attempts.flagged, true));
  if (filter === "in_progress") where.push(eq(schema.attempts.status, "in_progress"));
  if (filter === "disqualified") where.push(eq(schema.attempts.status, "disqualified"));

  const rows = await db
    .select({
      id: schema.attempts.id,
      status: schema.attempts.status,
      score: schema.attempts.score,
      maxScore: schema.attempts.maxScore,
      timeTakenMs: schema.attempts.timeTakenMs,
      focusLosses: schema.attempts.focusLosses,
      flagged: schema.attempts.flagged,
      startedAt: schema.attempts.startedAt,
      adminNote: schema.attempts.adminNote,
      grade: schema.attempts.grade,
      studentName: schema.registrations.studentName,
      regNo: schema.registrations.regNo,
      paymentStatus: schema.registrations.paymentStatus,
    })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.attempts.startedAt))
    .limit(300);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Exam attempts</h1>
        <p className="mt-1 text-sm text-ink/55">
          Attempts are flagged when the student left the exam screen 3 or more times. Review before results.
        </p>
      </div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/attempts?filter=${f.id}`}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold", filter === f.id ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10")}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-ink/8 text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Time</th>
              <th className="px-4 py-3 text-right">Screen exits</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {rows.map((r) => (
              <tr key={r.id} className={cn(r.flagged && r.status !== "disqualified" && "bg-amber-50/60")}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.studentName}</p>
                  <p className="font-mono text-xs text-ink/50">
                    {r.regNo} {r.paymentStatus !== "verified" && <span className="text-amber-700">· payment {r.paymentStatus}</span>}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {gradeLabel(r.grade)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={r.status === "submitted" ? "emerald" : r.status === "in_progress" ? "sky" : "rose"}>{r.status.replace("_", " ")}</Badge>
                  {r.adminNote && <p className="mt-1 max-w-[12rem] text-[11px] text-ink/50">{r.adminNote}</p>}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.score != null ? `${r.score}/${r.maxScore}` : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{r.timeTakenMs != null ? fmtDuration(r.timeTakenMs) : "—"}</td>
                <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", r.focusLosses >= 3 && "text-amber-700")}>{r.focusLosses}</td>
                <td className="px-4 py-3 text-xs text-ink/55">{fmtDateTime(r.startedAt)}</td>
                <td className="px-4 py-3">
                  <AttemptActions id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink/45">
                  No attempts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
