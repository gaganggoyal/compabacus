"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { currentStudent } from "@/lib/auth";
import { examTestMode, times } from "@/lib/config";
import { newId, randomSeed } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { generatePaper } from "@/lib/exam/generator";
import { levelById } from "@/lib/exam/levels";
import {
  FLAG_FOCUS_LOSSES,
  SUBMIT_GRACE_MS,
  attemptFor,
  finalizeAttempt,
  parsePaper,
  sanitiseAnswers,
} from "@/lib/exam/server";

export async function startExamAction(): Promise<{ error?: string }> {
  const reg = await currentStudent();
  if (!reg) return { error: "Please log in again." };
  const now = Date.now();
  if (!examTestMode()) {
    if (now < times.examStart) return { error: "The exam window has not opened yet." };
    if (now > times.examEnd) return { error: "The exam window has closed." };
  }
  if (reg.paymentStatus !== "submitted" && reg.paymentStatus !== "verified") {
    return { error: "Please complete the ₹10 payment before starting the exam." };
  }
  const existing = await attemptFor(reg.id);
  if (existing) {
    refresh();
    return {};
  }
  const level = levelById(reg.level);
  if (!level) return { error: "Unknown level. Please contact support." };
  const seed = randomSeed();
  const paper = generatePaper(level, seed);
  try {
    await db.insert(schema.attempts).values({
      id: newId(),
      registrationId: reg.id,
      level: reg.level,
      ageGroup: reg.ageGroup,
      seed,
      paper: JSON.stringify(paper),
      startedAt: new Date(now),
      deadlineAt: new Date(now + level.durationSec * 1000),
    });
  } catch {
    // Unique constraint: a parallel click already created the attempt.
  }
  refresh();
  return {};
}

type SaveResult = { ok: boolean; serverNow: number; closed?: boolean; error?: string };

async function ownedAttempt(attemptId: string) {
  const reg = await currentStudent();
  if (!reg) return null;
  const a = await db.query.attempts.findFirst({
    where: and(eq(schema.attempts.id, attemptId), eq(schema.attempts.registrationId, reg.id)),
  });
  return a ?? null;
}

export async function saveProgressAction(attemptId: string, answers: unknown, focusLosses: number): Promise<SaveResult> {
  const now = Date.now();
  const a = await ownedAttempt(attemptId);
  if (!a) return { ok: false, serverNow: now, error: "Session expired. Please log in again." };
  if (a.status !== "in_progress") return { ok: false, serverNow: now, closed: true };
  if (now > a.deadlineAt.getTime() + SUBMIT_GRACE_MS) {
    await finalizeAttempt(a, sanitiseAnswers(parsePaper(a), JSON.parse(a.answers)), a.focusLosses, now);
    return { ok: false, serverNow: now, closed: true };
  }
  const losses = Math.max(a.focusLosses, Math.min(999, Math.floor(Number(focusLosses) || 0)));
  await db
    .update(schema.attempts)
    .set({
      answers: JSON.stringify(sanitiseAnswers(parsePaper(a), answers)),
      lastSavedAt: new Date(now),
      focusLosses: losses,
      flagged: a.flagged || losses >= FLAG_FOCUS_LOSSES,
    })
    .where(and(eq(schema.attempts.id, a.id), eq(schema.attempts.status, "in_progress")));
  return { ok: true, serverNow: now };
}

export async function submitExamAction(attemptId: string, answers: unknown, focusLosses: number): Promise<SaveResult> {
  const now = Date.now();
  const a = await ownedAttempt(attemptId);
  if (!a) return { ok: false, serverNow: now, error: "Session expired. Please log in again." };
  if (a.status !== "in_progress") return { ok: true, serverNow: now, closed: true };
  const paper = parsePaper(a);
  // Answers arriving after the grace period are ignored; the last autosave counts.
  const late = now > a.deadlineAt.getTime() + SUBMIT_GRACE_MS;
  const final = late ? sanitiseAnswers(paper, JSON.parse(a.answers)) : sanitiseAnswers(paper, answers);
  await finalizeAttempt(a, final, Math.floor(Number(focusLosses) || 0), now);
  refresh();
  return { ok: true, serverNow: now };
}
