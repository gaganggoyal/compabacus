import { Download } from "lucide-react";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { ResultsControls } from "@/components/admin/admin-forms";
import { Card, PageLoading } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { AGE_GROUPS, times } from "@/lib/config";
import { LEVELS } from "@/lib/exam/levels";
import { AWARD_META, fmtDateTime, fmtDuration } from "@/lib/format";
import { rankedResults } from "@/lib/results";
import { getResultsMode, getSetting } from "@/lib/settings";

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminResults />
    </Suspense>
  );
}

async function AdminResults() {
  await requireAdmin();
  const now = await requestNow();
  const mode = await getResultsMode();
  const computedAt = Number((await getSetting("results_computed_at")) ?? 0);
  const rows = await rankedResults();
  const publicNow = mode === "published" || (mode === "auto" && now >= times.resultsAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Results</h1>
          <p className="mt-1 text-sm text-ink/55">
            Scheduled reveal: <b>{fmtDateTime(times.resultsAt)}</b> · Currently <b>{publicNow ? "PUBLIC" : "hidden from public"}</b> · Last computed:{" "}
            {computedAt ? fmtDateTime(computedAt) : "never"}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- CSV file download */}
        <a href="/admin/export/results" className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-ink/10 hover:ring-ink/25">
          <Download className="h-4 w-4" /> Results CSV
        </a>
      </div>

      <Card className="p-6">
        <p className="font-display text-lg font-bold">Publishing</p>
        <p className="mb-4 mt-1 text-sm text-ink/55">
          In Auto mode, rankings are computed automatically and published at the scheduled time — no action needed at midnight. Verify all pending
          payments and review flagged attempts before then; only verified payments are ranked. You can recompute any time to preview.
        </p>
        <ResultsControls mode={mode} />
      </Card>

      {AGE_GROUPS.map((g) => {
        const inGroup = rows.filter((r) => r.ageGroup === g.id);
        if (!inGroup.length) return null;
        return (
          <Card key={g.id} className="overflow-x-auto p-6">
            <p className="font-display text-lg font-bold">
              Group {g.id} · {g.label} ({g.min}–{g.max})
            </p>
            <table className="mt-4 w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink/45">
                <tr>
                  <th className="py-2">Level</th>
                  <th className="py-2">Rank</th>
                  <th className="py-2">Student</th>
                  <th className="py-2 text-right">Score</th>
                  <th className="py-2 text-right">Time</th>
                  <th className="py-2 text-right">Award</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {LEVELS.flatMap((l) =>
                  inGroup
                    .filter((r) => r.level === l.id && r.rank <= 5)
                    .map((r) => (
                      <tr key={r.attemptId}>
                        <td className="py-2 text-xs">{l.id}</td>
                        <td className="py-2 font-bold">#{r.rank}</td>
                        <td className="py-2">
                          {r.studentName} <span className="text-xs text-ink/45">{r.city}</span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {r.score}/{r.maxScore}
                        </td>
                        <td className="py-2 text-right tabular-nums">{fmtDuration(r.timeTakenMs)}</td>
                        <td className="py-2 text-right text-xs">
                          {AWARD_META[r.award].emoji} {AWARD_META[r.award].label}
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </Card>
        );
      })}
      {!rows.length && <p className="rounded-2xl bg-white p-10 text-center text-ink/45 ring-1 ring-ink/8">No rankings yet — press “Compute”.</p>}
    </div>
  );
}
