"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { INDIAN_STATES, MAX_AGE, MIN_AGE, ageGroupFor, ageOn, examTestMode, site, times } from "@/lib/config";
import { hashSecret, newId, randomDigits, verifySecret } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { levelById } from "@/lib/exam/levels";
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
    level: z.string().refine((v) => !!levelById(v), "Choose a level"),
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
      .max(120)
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email")
      .optional(),
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
  const group = ageGroupFor(d.dob)!;

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
    ageGroup: group.id,
    level: d.level,
    school: d.school || null,
    parentName: d.parentName,
    phone: d.phone,
    email: d.email || null,
    city: d.city,
    state: d.state,
    country: d.state === "Outside India" ? d.country?.trim() || "Other" : "India",
    pinHash: await hashSecret(d.pin),
    consentAt: now,
    createdAt: now,
  });

  await setStudentSession(id);
  redirect("/dashboard/payment?welcome=1");
}

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let regNo = String(formData.get("regNo") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (/^\d{6}$/.test(regNo)) regNo = `${site.regPrefix}-${regNo}`;
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

export type LookupState = { results?: { regNo: string; name: string; level: string }[]; message?: string };

export async function lookupByPhoneAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { message: "Enter the mobile number used during registration." };
  const rows = await db.query.registrations.findMany({ where: eq(schema.registrations.phone, phone), limit: 10 });
  if (!rows.length) return { message: "No registrations found for this number." };
  return {
    results: rows.map((r) => ({ regNo: r.regNo, name: maskName(r.studentName), level: levelById(r.level)?.name ?? r.level })),
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
