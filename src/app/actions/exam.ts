"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { currentStudent } from "@/lib/auth";
import { newId, randomSeed } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { generatePaper } from "@/lib/exam/generator";
import { gradeById } from "@/lib/exam/papers";
import {
  FLAG_FOCUS_LOSSES,
  SUBMIT_GRACE_MS,
  attemptFor,
  finalizeAttempt,
  parsePaper,
  sanitiseAnswers,
} from "@/lib/exam/server";
import { examGate, gateMessage } from "@/lib/student-view";

export async function startExamAction(): Promise<{ error?: string }> {
  const reg = await currentStudent();
  if (!reg) return { error: "Please log in again." };
  const now = Date.now();
  const existing = await attemptFor(reg.id);
  if (existing) {
    refresh();
    return {};
  }
  // Same rules as the dashboard: paid, slot booked, and only during that slot.
  const gate = examGate(reg, undefined, now);
  if (gate.kind !== "open") return { error: gateMessage(gate) };
  const grade = gradeById(reg.grade);
  if (!grade) return { error: "Unknown class. Please contact support." };
  const seed = randomSeed();
  const paper = generatePaper(grade.id, grade.paper, seed);
  try {
    await db.insert(schema.attempts).values({
      id: newId(),
      registrationId: reg.id,
      grade: reg.grade,
      seed,
      paper: JSON.stringify(paper),
      startedAt: new Date(now),
      deadlineAt: new Date(now + grade.paper.durationSec * 1000),
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
