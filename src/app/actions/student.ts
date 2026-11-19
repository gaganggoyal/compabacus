"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { INDIAN_STATES, MAX_AGE, MIN_AGE, ageOn, examTestMode, site, times } from "@/lib/config";
import { hashSecret, newId, randomDigits, verifySecret } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { notifyRegistrations, sendPinReset } from "@/lib/email/notify";
import { EMAIL_RE } from "@/lib/email/send";
import { gradeById, gradeLabel } from "@/lib/exam/papers";
import { maskName } from "@/lib/format";
import { requireStudent } from "@/lib/auth";
import { clearStudentSession, setStudentSession } from "@/lib/session";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} is too long`);

function normalisePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^(\+?91)?[6-9]\d{9}$/.test(digits)) return digits.slice(-10);
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  return null;
}

const registerSchema = z
  .object({
    studentName: text(2, 60, "Student name"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth is required"),
    gender: z.enum(["", "girl", "boy", "other"]).optional(),
    school: z.string().trim().max(100).optional(),
    grade: z.string().refine((v) => !!gradeById(v), "Choose your child's class"),
    parentName: text(2, 60, "Parent / guardian name"),
    phone: z.string().transform((v, ctx) => {
      const p = normalisePhone(v);
      if (!p) {
        ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit mobile number" });
        return z.NEVER;
      }
      return p;
    }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(120, "Email is too long")
      .regex(EMAIL_RE, "Enter a valid email. We send the registration number, payment confirmation and results here."),
    city: text(2, 60, "City"),
    state: z.string().refine((v) => (INDIAN_STATES as readonly string[]).includes(v), "Choose your state"),
    country: z.string().trim().max(60).optional(),
    pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
    pinConfirm: z.string(),
    consent: z.literal("on", { error: "Parent / guardian consent is required" }),
  })
  .refine((d) => d.pin === d.pinConfirm, { path: ["pinConfirm"], message: "PINs do not match" })
  .superRefine((d, ctx) => {
    const age = ageOn(d.dob);
    if (Number.isNaN(age) || age < MIN_AGE || age > MAX_AGE) {
      ctx.addIssue({
        code: "custom",
        path: ["dob"],
        message: `Students must be ${MIN_AGE}–${MAX_AGE} years old on 1 Dec 2026 (this date gives ${Number.isNaN(age) ? "?" : age})`,
      });
      return;
    }
    const grade = gradeById(d.grade);
    if (grade && (age < grade.ages[0] || age > grade.ages[1])) {
      ctx.addIssue({
        code: "custom",
        path: ["grade"],
        message: `${grade.label} is for children aged ${grade.ages[0]}–${grade.ages[1]} on 1 Dec 2026, but this date of birth gives ${age}. Please check the class or date of birth.`,
      });
    }
  });

function issuesToErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!errors[k]) errors[k] = i.message;
  }
  return errors;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (Date.now() > times.examEnd && !examTestMode()) {
    return { message: "Registrations are closed for this edition." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: issuesToErrors(parsed.error.issues), message: "Please fix the highlighted fields." };
  }
  const d = parsed.data;

  const [{ n }] = await db.select({ n: count() }).from(schema.registrations).where(eq(schema.registrations.phone, d.phone));
  if (n >= 8) {
    return { message: "Too many registrations with this mobile number. Contact us on WhatsApp for help." };
  }

  const dup = await db.query.registrations.findFirst({
    where: and(
      eq(schema.registrations.phone, d.phone),
      eq(schema.registrations.dob, d.dob),
      eq(schema.registrations.studentName, d.studentName),
    ),
  });
  if (dup) {
    return {
      message: `${d.studentName} is already registered (Reg. No. ${dup.regNo}). Please log in with that number.`,
    };
  }

  const id = newId();
  const now = new Date();
  let regNo = "";
  for (let i = 0; i < 10; i++) {
    const candidate = `${site.regPrefix}-${randomDigits(6)}`;
    const taken = await db.query.registrations.findFirst({ where: eq(schema.registrations.regNo, candidate) });
    if (!taken) {
      regNo = candidate;
      break;
    }
  }
  if (!regNo) return { message: "Could not create a registration number. Please try again." };

  await db.insert(schema.registrations).values({
    id,
    regNo,
    studentName: d.studentName,
    dob: d.dob,
    gender: d.gender || null,
    grade: d.grade,
    school: d.school || null,
    parentName: d.parentName,
    phone: d.phone,
    email: d.email,
    city: d.city,
    state: d.state,
    country: d.state === "Outside India" ? d.country?.trim() || "Other" : "India",
    pinHash: await hashSecret(d.pin),
    consentAt: now,
    createdAt: now,
  });

  notifyRegistrations("registered", [id]);
  await setStudentSession(id);
  redirect("/dashboard/payment?welcome=1");
}

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

/** "kc26 123456" and "123456" both become "KC26-123456". */
function normaliseRegNo(raw: string) {
  const regNo = raw.trim().toUpperCase().replace(/\s+/g, "");
  return /^\d{6}$/.test(regNo) ? `${site.regPrefix}-${regNo}` : regNo;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const regNo = normaliseRegNo(String(formData.get("regNo") ?? ""));
  const pin = String(formData.get("pin") ?? "").trim();
  if (!regNo || !/^\d{6}$/.test(pin)) {
    return { message: "Enter your registration number and 6-digit PIN." };
  }
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.regNo, regNo) });
  if (!reg) return { message: "Registration number or PIN is incorrect." };

  if (reg.lockedUntil && reg.lockedUntil.getTime() > Date.now()) {
    return { message: "Too many wrong attempts. Please wait 15 minutes and try again." };
  }
  if (!(await verifySecret(pin, reg.pinHash))) {
    const fails = reg.failedLogins + 1;
    await db
      .update(schema.registrations)
      .set({
        failedLogins: fails >= LOCK_AFTER ? 0 : fails,
        lockedUntil: fails >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : reg.lockedUntil,
      })
      .where(eq(schema.registrations.id, reg.id));
    return { message: "Registration number or PIN is incorrect." };
  }
  if (reg.failedLogins || reg.lockedUntil) {
    await db
      .update(schema.registrations)
      .set({ failedLogins: 0, lockedUntil: null })
      .where(eq(schema.registrations.id, reg.id));
  }
  await setStudentSession(reg.id);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/dashboard") || next === "/exam" ? next : "/dashboard");
}

export async function logoutAction() {
  await clearStudentSession();
  redirect("/");
}

const RESET_TTL_MS = 30 * 60 * 1000;
const RESETS_PER_HOUR = 3;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Emails a single-use "set a new PIN" link. Always gives the same answer, so it can't be used to discover registrations. */
export async function requestPinResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const regNo = normaliseRegNo(String(formData.get("regNo") ?? ""));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const errors: Record<string, string> = {};
  if (!regNo) errors.regNo = "Enter the registration number";
  if (!EMAIL_RE.test(email)) errors.email = "Enter the parent email used at registration";
  if (Object.keys(errors).length) return { errors };

  const done: FormState = {
    ok: true,
    message: "If these details match a registration, we've emailed a link to set a new PIN. It works for 30 minutes. Check the spam folder too.",
  };
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.regNo, regNo) });
  if (!reg || reg.email?.toLowerCase() !== email) return done;

  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.emailLog)
    .where(
      and(
        eq(schema.emailLog.registrationId, reg.id),
        eq(schema.emailLog.kind, "pin_reset"),
        gt(schema.emailLog.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );
  if (n >= RESETS_PER_HOUR) return done;

  const token = randomBytes(32).toString("base64url");
  await db
    .update(schema.registrations)
    .set({ pinResetHash: sha256(token), pinResetExpires: new Date(Date.now() + RESET_TTL_MS) })
    .where(eq(schema.registrations.id, reg.id));
  sendPinReset(reg, `${site.url}/reset-pin?token=${token}`);
  return done;
}

export async function resetPinWithTokenAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const pinConfirm = String(formData.get("pinConfirm") ?? "").trim();
  if (!/^\d{6}$/.test(pin)) return { errors: { pin: "PIN must be exactly 6 digits" } };
  if (pin !== pinConfirm) return { errors: { pinConfirm: "PINs do not match" } };

  const expired: FormState = { message: "This link has expired or was already used. Please ask for a new one." };
  if (!token) return expired;
  const hash = sha256(token);
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.pinResetHash, hash) });
  if (!reg || !reg.pinResetExpires || reg.pinResetExpires.getTime() < Date.now()) return expired;

  const res = await db
    .update(schema.registrations)
    .set({ pinHash: await hashSecret(pin), pinResetHash: null, pinResetExpires: null, failedLogins: 0, lockedUntil: null })
    .where(and(eq(schema.registrations.id, reg.id), eq(schema.registrations.pinResetHash, hash)));
  if (!res.rowsAffected) return expired;

  await setStudentSession(reg.id);
  redirect("/dashboard");
}

export type LookupState = { results?: { regNo: string; name: string; grade: string }[]; message?: string };

export async function lookupByPhoneAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { message: "Enter the mobile number used during registration." };
  const rows = await db.query.registrations.findMany({ where: eq(schema.registrations.phone, phone), limit: 10 });
  if (!rows.length) return { message: "No registrations found for this number." };
  return {
    results: rows.map((r) => ({ regNo: r.regNo, name: maskName(r.studentName), grade: gradeLabel(r.grade) })),
  };
}

export async function submitUtrAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const reg = await requireStudent();
  if (reg.paymentStatus === "verified") return { ok: true, message: "Your payment is already verified." };
  const utr = String(formData.get("utr") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "");
  if (!/^[A-Z0-9]{10,22}$/.test(utr)) {
    return { errors: { utr: "Enter the 12-digit UPI reference / UTR number from your payment app" } };
  }
  const used = await db.query.registrations.findFirst({
    where: and(eq(schema.registrations.utr, utr), ne(schema.registrations.id, reg.id)),
  });
  if (used) {
    return {
      errors: { utr: "This transaction ID is already linked to another registration. Each child needs a separate ₹10 payment." },
    };
  }
  await db
    .update(schema.registrations)
    .set({ utr, paymentStatus: "submitted", paymentSubmittedAt: new Date(), paymentNote: null })
    .where(eq(schema.registrations.id, reg.id));
  refresh();
  return { ok: true, message: "Thanks! Your payment is submitted for verification." };
}
