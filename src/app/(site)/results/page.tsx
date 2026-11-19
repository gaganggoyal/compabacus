import { Crown, Medal, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { Countdown } from "@/components/countdown";
import { Card, PageLoading, cn } from "@/components/ui";
import { times } from "@/lib/config";
import { GRADES, STAGES } from "@/lib/exam/papers";
import { fmtDateTime, fmtDuration, publicName } from "@/lib/format";
import { type RankedRow, rankedResults, resultsLive } from "@/lib/results";

export const metadata: Metadata = {
  title: "Results & Hall of Fame",
  description: "Champions and runners-up of every class, Nursery to Class 12.",
};

export default function ResultsPage({ searchParams }: PageProps<"/results">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/results">["searchParams"] }) {
  const now = await requestNow();
  const live = await resultsLive(now);

  if (!live) {
    return (
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grain absolute inset-0" />
        <div className="container-x relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
          <Trophy className="h-14 w-14 text-amber-300" />
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold text-balance sm:text-6xl">
            Winners will be crowned on <span className="gold-text">New Year&apos;s Day</span>
          </h1>
          <p className="mt-4 text-lg text-indigo-100/75">Results go live at {fmtDateTime(times.resultsAt)} IST.</p>
          <Countdown className="mt-10 flex flex-col items-center" />
        </div>
      </section>
    );
  }

  const sp = await searchParams;
  const stageId = typeof sp.stage === "string" && STAGES.some((s) => s.id === sp.stage) ? sp.stage : STAGES[0].id;
  const rows = await rankedResults();
  const stage = STAGES.find((s) => s.id === stageId)!;
  const grades = GRADES.filter((g) => g.stage === stageId);
  const inStage = rows.filter((r) => grades.some((g) => g.id === r.grade));
  const champions = rows.filter((r) => r.award === "champion").length;

  return (
    <div>
      <section className="relative overflow-hidden bg-ink pb-16 pt-14 text-white">
        <div className="grain absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-72 w-[50rem] -translate-x-1/2 rounded-full bg-amber-500/15 blur-[100px]" />
        <div className="container-x relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Hall of Fame</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-6xl">
            Championship <span className="gold-text">Results</span>
          </h1>
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: Users, k: rows.length, v: "ranked students" },
              { icon: Crown, k: champions, v: "champions" },
              { icon: Medal, k: new Set(rows.map((r) => r.grade)).size, v: "classes" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <s.icon className="mx-auto h-5 w-5 text-amber-300" />
                <p className="mt-2 font-display text-2xl font-bold tabular-nums">{s.k}</p>
                <p className="text-xs text-indigo-100/60">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-12">
        <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="School stages">
          {STAGES.map((s) => (
            <Link
              key={s.id}
              href={`/results?stage=${s.id}`}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                s.id === stageId ? "bg-ink text-white" : "bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-ink/25",
              )}
            >
              {s.label} · {s.short}
            </Link>
          ))}
        </nav>

        <h2 className="mt-8 font-display text-2xl font-bold">
          {stage.label} — {stage.short}
        </h2>

        <div className="mt-6 space-y-6">
          {grades.map((g) => {
            const list = inStage.filter((r) => r.grade === g.id);
            if (!list.length) return null;
            return <CategoryBlock key={g.id} title={g.label} rows={list} />;
          })}
          {!inStage.length && <p className="rounded-3xl bg-white p-8 text-center text-ink/50 ring-1 ring-ink/8">No ranked students in these classes.</p>}
        </div>

        <p className="mt-10 text-center text-sm text-ink/50">
          Participants can see their own score and download certificates from their{" "}
          <Link href="/dashboard" className="font-semibold text-indigo-600 hover:underline">
            dashboard
          </Link>
          . Verify any certificate on the{" "}
          <Link href="/verify" className="font-semibold text-indigo-600 hover:underline">
            verification page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function CategoryBlock({ title, rows }: { title: string; rows: RankedRow[] }) {
  const podium = rows.filter((r) => r.rank <= 3 && (r.award === "champion" || r.award === "runner_up_1" || r.award === "runner_up_2"));
  const styles = [
    "bg-gradient-to-br from-amber-200 to-amber-400 ring-amber-300",
    "bg-gradient-to-br from-slate-100 to-slate-300 ring-slate-300",
    "bg-gradient-to-br from-orange-200 to-orange-400 ring-orange-300",
  ];
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="text-sm text-ink/50">{rows.length} ranked</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {podium.map((r) => (
          <div key={r.attemptId} className={cn("rounded-2xl p-4 ring-1", styles[Math.min(2, r.rank - 1)])}>
            <p className="text-xs font-bold uppercase tracking-wider text-ink/60">
              {r.rank === 1 ? "🥇 Champion" : r.rank === 2 ? "🥈 1st Runner-up" : "🥉 2nd Runner-up"}
            </p>
            <p className="mt-1 font-display text-lg font-bold">{publicName(r.studentName)}</p>
            <p className="text-xs text-ink/60">
              {r.city}, {r.state}
            </p>
            <p className="mt-2 text-sm font-semibold tabular-nums">
              {r.score}/{r.maxScore} · {fmtDuration(r.timeTakenMs)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
