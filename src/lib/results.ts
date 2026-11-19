import "server-only";
import { and, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { site, times } from "./config";
import { randomCode } from "./crypto";
import { db, schema } from "./db";
import type { Award } from "./db/schema";
import { finalizeExpiredAttempts } from "./exam/server";
import { getResultsMode, getSetting, setSetting } from "./settings";

export type RankedRow = {
  attemptId: string;
  regNo: string;
  studentName: string;
  city: string;
  state: string;
  school: string | null;
  grade: string;
  score: number;
  maxScore: number;
  timeTakenMs: number;
  rank: number;
  award: Award;
  certNo: string;
};

function awardFor(rank: number, score: number, max: number): Award {
  const pct = max ? score / max : 0;
  if (score > 0 && rank === 1) return "champion";
  if (score > 0 && rank === 2) return "runner_up_1";
  if (score > 0 && rank === 3) return "runner_up_2";
  if (pct >= 0.9) return "distinction";
  if (pct >= 0.75) return "merit";
  return "participation";
}

/**
 * Ranks every submitted attempt whose payment is verified, separately for each class.
 * Order: score desc, then time taken asc, then submission time asc. Idempotent.
 */
export async function computeResults() {
  const now = Date.now();
  await finalizeExpiredAttempts(now);

  const rows = await db
    .select({
      id: schema.attempts.id,
      grade: schema.attempts.grade,
      score: schema.attempts.score,
      maxScore: schema.attempts.maxScore,
      timeTakenMs: schema.attempts.timeTakenMs,
      submittedAt: schema.attempts.submittedAt,
      certNo: schema.attempts.certNo,
    })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(and(eq(schema.attempts.status, "submitted"), eq(schema.registrations.paymentStatus, "verified")));

  const byCat = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = r.grade;
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(r);
  }

  const eligibleIds: string[] = [];
  const updates: { id: string; rank: number; award: Award; certNo: string }[] = [];
  for (const list of byCat.values()) {
    list.sort(
      (a, b) =>
        (b.score ?? 0) - (a.score ?? 0) ||
        (a.timeTakenMs ?? 0) - (b.timeTakenMs ?? 0) ||
        (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0),
    );
    let rank = 0;
    let prev: (typeof list)[number] | null = null;
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (!prev || prev.score !== r.score || prev.timeTakenMs !== r.timeTakenMs) rank = i + 1;
      prev = r;
      const award = awardFor(rank, r.score ?? 0, r.maxScore ?? 0);
      const certNo = r.certNo ?? `${site.certPrefix}-${randomCode(7)}`;
      updates.push({ id: r.id, rank, award, certNo });
      eligibleIds.push(r.id);
    }
  }

  // One round-trip per 200 rows — matters on a remote database.
  for (let i = 0; i < updates.length; i += 200) {
    const chunk = updates.slice(i, i + 200).map((u) =>
      db
        .update(schema.attempts)
        .set({ rank: u.rank, award: u.award, certNo: u.certNo })
        .where(eq(schema.attempts.id, u.id)),
    );
    if (chunk.length) await db.batch(chunk as [(typeof chunk)[number], ...typeof chunk]);
  }

  // Clear ranks for anything no longer eligible (disqualified, payment rejected…).
  const stale = await db
    .select({ id: schema.attempts.id })
    .from(schema.attempts)
    .where(or(isNotNull(schema.attempts.rank), isNotNull(schema.attempts.award)));
  const eligible = new Set(eligibleIds);
  const toClear = stale.map((s) => s.id).filter((id) => !eligible.has(id));
  if (toClear.length) {
    await db.update(schema.attempts).set({ rank: null, award: null }).where(inArray(schema.attempts.id, toClear));
  }

  await setSetting("results_computed_at", String(now));
  return { ranked: eligibleIds.length, categories: byCat.size };
}

/** Are results visible to the public right now? Computes them lazily on first view after the reveal time. */
export async function resultsLive(now: number) {
  const mode = await getResultsMode();
  if (mode === "hidden") return false;
  const live = mode === "published" || now >= times.resultsAt;
  if (!live) return false;
  const computedAt = Number((await getSetting("results_computed_at")) ?? 0);
  if (!computedAt || computedAt < Math.min(now, times.examEnd)) {
    await computeResults();
  }
  return true;
}

export async function rankedResults(): Promise<RankedRow[]> {
  const rows = await db
    .select({
      attemptId: schema.attempts.id,
      regNo: schema.registrations.regNo,
      studentName: schema.registrations.studentName,
      city: schema.registrations.city,
      state: schema.registrations.state,
      school: schema.registrations.school,
      grade: schema.attempts.grade,
      score: schema.attempts.score,
      maxScore: schema.attempts.maxScore,
      timeTakenMs: schema.attempts.timeTakenMs,
      rank: schema.attempts.rank,
      award: schema.attempts.award,
      certNo: schema.attempts.certNo,
    })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(and(isNotNull(schema.attempts.rank), ne(schema.attempts.status, "disqualified")));
  return rows
    .map((r) => ({
      ...r,
      score: r.score ?? 0,
      maxScore: r.maxScore ?? 0,
      timeTakenMs: r.timeTakenMs ?? 0,
      rank: r.rank ?? 0,
      award: (r.award ?? "participation") as Award,
      certNo: r.certNo ?? "",
    }))
    .sort((a, b) => a.rank - b.rank);
}

export async function certificateByNo(certNo: string) {
  const rows = await db
    .select({
      certNo: schema.attempts.certNo,
      award: schema.attempts.award,
      rank: schema.attempts.rank,
      score: schema.attempts.score,
      maxScore: schema.attempts.maxScore,
      grade: schema.attempts.grade,
      status: schema.attempts.status,
      studentName: schema.registrations.studentName,
      school: schema.registrations.school,
      city: schema.registrations.city,
      state: schema.registrations.state,
      regNo: schema.registrations.regNo,
    })
    .from(schema.attempts)
    .innerJoin(schema.registrations, eq(schema.registrations.id, schema.attempts.registrationId))
    .where(eq(schema.attempts.certNo, certNo.trim().toUpperCase()))
    .limit(1);
  const r = rows[0];
  if (!r || !r.award || r.status === "disqualified") return null;
  return r;
}
