"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentSchool } from "@/lib/auth";
import { INDIAN_STATES, examTestMode, site, times } from "@/lib/config";
import { encryptPin, hashSecret, newId, randomDigits, verifySecret } from "@/lib/crypto";
import { db, schema } from "@/lib/db";
import { notifySchool, notifySlotBooked } from "@/lib/email/notify";
import { EMAIL_RE } from "@/lib/email/send";
import { gradeById } from "@/lib/exam/papers";
import { attemptFor } from "@/lib/exam/server";
import { chargeFor } from "@/lib/pricing";
import {
  MAX_BULK_ROWS,
  MAX_STUDENTS_PER_SCHOOL,
  type NewStudent,
  createSchoolStudents,
  schoolStudent,
  schoolStudentCount,
  syncSchoolStudents,
  uniqueSchoolCode,
} from "@/lib/schools";
import { clearSchoolSession, setSchoolSession } from "@/lib/session";
import { slotById } from "@/lib/slots";
import { bookSlot } from "@/lib/slots-server";
import { canBookSlot } from "@/lib/student-view";
import { eligibilityError, normalisePhone, parseDob, parseGrade } from "@/lib/validation";

export type SchoolFormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Students just added, with their PINs, so the school can note them down straight away. */
  added?: { regNo: string; name: string; pin: string }[];
  skipped?: { name: string; reason: string }[];
};

const text = (min: number, max: number, label: string) => z.string().trim().min(min, `${label} is required`).max(max, `${label} is too long`);

const phoneField = z.string().transform((v, ctx) => {
  const p = normalisePhone(v);
  if (!p) {
    ctx.addIssue({ code: "custom", message: "Enter a valid 10-digit mobile number" });
    return z.NEVER;
  }
  return p;
});

const schoolSchema = z
  .object({
    name: text(3, 120, "School name"),
    contactName: text(2, 60, "Contact person"),
    phone: phoneField,
    email: z.string().trim().toLowerCase().max(120).regex(EMAIL_RE, "Enter a valid email. You log in with it and we send updates here."),
    city: text(2, 60, "City"),
    state: z.string().refine((v) => (INDIAN_STATES as readonly string[]).includes(v), "Choose your state"),
    password: z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters"),
    passwordConfirm: z.string(),
    consent: z.literal("on", { error: "Please confirm that parents have agreed" }),
  })
  .refine((d) => d.password === d.passwordConfirm, { path: ["passwordConfirm"], message: "Passwords do not match" });

function issuesToErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "form");
    if (!errors[k]) errors[k] = i.message;
  }
  return errors;
}

/** For actions: the logged-in school, or a redirect to the school login. */
async function schoolOrLogin() {
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  return school;
}

export async function registerSchoolAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  if (Date.now() > times.examEnd && !examTestMode()) return { message: "Registrations are closed for this edition." };
  const parsed = schoolSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: issuesToErrors(parsed.error.issues), message: "Please fix the highlighted fields." };
  const d = parsed.data;
  const taken = await db.query.schools.findFirst({ where: eq(schema.schools.email, d.email), columns: { code: true } });
  if (taken) return { errors: { email: `This email already has a school account (${taken.code}). Log in instead.` } };

  const id = newId();
  const now = new Date();
  await db.insert(schema.schools).values({
    id,
    code: await uniqueSchoolCode(),
    name: d.name,
    contactName: d.contactName,
    phone: d.phone,
    email: d.email,
    city: d.city,
    state: d.state,
    passwordHash: await hashSecret(d.password),
    feeAmount: chargeFor("school", now.getTime()),
    consentAt: now,
    createdAt: now,
  });
  notifySchool("school_registered", id);
  await setSchoolSession(id);
  redirect("/schools/dashboard/payment?welcome=1");
}

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function schoolLoginAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) return { message: "Enter your school email (or school code) and password." };
  const code = login.toUpperCase().replace(/\s+/g, "");
  const school = await db.query.schools.findFirst({
    where: login.includes("@") ? eq(schema.schools.email, login.toLowerCase()) : eq(schema.schools.code, /^\d{5}$/.test(code) ? `${site.schoolPrefix}-${code}` : code),
  });
  if (!school) return { message: "School email/code or password is incorrect." };
  if (school.lockedUntil && school.lockedUntil.getTime() > Date.now()) return { message: "Too many wrong attempts. Please wait 15 minutes and try again." };
  if (!(await verifySecret(password, school.passwordHash))) {
    const fails = school.failedLogins + 1;
    await db
      .update(schema.schools)
      .set({ failedLogins: fails >= LOCK_AFTER ? 0 : fails, lockedUntil: fails >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : school.lockedUntil })
      .where(eq(schema.schools.id, school.id));
    return { message: "School email/code or password is incorrect." };
  }
  if (school.failedLogins || school.lockedUntil) {
    await db.update(schema.schools).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.schools.id, school.id));
  }
  await setSchoolSession(school.id);
  redirect("/schools/dashboard");
}

export async function schoolLogoutAction() {
  await clearSchoolSession();
  redirect("/schools");
}

export async function submitSchoolUtrAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const school = await schoolOrLogin();
  if (school.paymentStatus === "verified") return { ok: true, message: "Your payment is already verified." };
  const utr = String(formData.get("utr") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, "");
  if (!/^[A-Z0-9]{10,22}$/.test(utr)) return { errors: { utr: "Enter the 12-digit UPI reference / UTR number from your payment app" } };
  const used =
    (await db.query.schools.findFirst({ where: and(eq(schema.schools.utr, utr), ne(schema.schools.id, school.id)), columns: { id: true } })) ??
    (await db.query.registrations.findFirst({ where: eq(schema.registrations.utr, utr), columns: { id: true } }));
  if (used) return { errors: { utr: "This transaction ID is already linked to another registration." } };
  await db
    .update(schema.schools)
    .set({ utr, paymentStatus: "submitted", paymentSubmittedAt: new Date(), paymentNote: null })
    .where(eq(schema.schools.id, school.id));
  await syncSchoolStudents(school.id, "submitted");
  refresh();
  return { ok: true, message: "Thanks! Your payment is submitted for verification. Your students can already book slots." };
}

function studentFromForm(formData: FormData): { row?: NewStudent; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const studentName = String(formData.get("studentName") ?? "").trim().replace(/\s+/g, " ");
  const dob = parseDob(String(formData.get("dob") ?? ""));
  const grade = String(formData.get("grade") ?? "");
  const gender = String(formData.get("gender") ?? "");
  const parentName = String(formData.get("parentName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (studentName.length < 2 || studentName.length > 60) errors.studentName = "Enter the student's full name";
  if (!dob) errors.dob = "Enter a valid date of birth";
  if (!gradeById(grade)) errors.grade = "Choose the class";
  const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
  if (phoneRaw && !phone) errors.phone = "Enter a valid 10-digit mobile number, or leave it empty";
  if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email, or leave it empty";
  if (dob && gradeById(grade)) {
    const problem = eligibilityError(dob, grade);
    if (problem) errors[problem.field] = problem.message;
  }
  if (Object.keys(errors).length) return { errors };
  return {
    row: {
      studentName,
      dob: dob!,
      grade,
      gender: ["girl", "boy", "other"].includes(gender) ? gender : null,
      parentName: parentName.slice(0, 60) || null,
      phone,
      email: email || null,
    },
  };
}

async function roomFor(schoolId: string, n: number) {
  return (await schoolStudentCount(schoolId)) + n <= MAX_STUDENTS_PER_SCHOOL;
}

export async function addSchoolStudentAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const school = await schoolOrLogin();
  const { row, errors } = studentFromForm(formData);
  if (!row) return { errors, message: "Please fix the highlighted fields." };
  if (!(await roomFor(school.id, 1))) return { message: `A school can register up to ${MAX_STUDENTS_PER_SCHOOL} students. Contact us for more.` };
  const { added, skipped } = await createSchoolStudents(school, [row]);
  refresh();
  if (!added.length) return { message: `${row.studentName} was not added: ${skipped[0]?.reason ?? "please try again"}.` };
  return { ok: true, message: `${row.studentName} is registered.`, added: added.map(({ regNo, name, pin }) => ({ regNo, name, pin })) };
}

/** One student per line: Name, Date of birth, Class[, Parent mobile][, Parent email] */
export async function bulkAddStudentsAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const school = await schoolOrLogin();
  const lines = String(formData.get("rows") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^name\s*[,\t]/i.test(l));
  if (!lines.length) return { message: "Paste at least one student: Name, Date of birth, Class." };
  if (lines.length > MAX_BULK_ROWS) return { message: `Add at most ${MAX_BULK_ROWS} students at a time. Split the list and paste again.` };

  const rows: NewStudent[] = [];
  const skipped: { name: string; reason: string }[] = [];
  lines.forEach((line, i) => {
    const cells = line.split(/\t|,/).map((c) => c.trim());
    const [studentName = "", dobRaw = "", gradeRaw = "", ...rest] = cells;
    const label = `Line ${i + 1}${studentName ? ` (${studentName})` : ""}`;
    const dob = parseDob(dobRaw);
    const grade = parseGrade(gradeRaw);
    const phoneRaw = rest.find((c) => /\d{6,}/.test(c)) ?? "";
    const email = (rest.find((c) => c.includes("@")) ?? "").toLowerCase();
    if (studentName.length < 2) return void skipped.push({ name: label, reason: "missing student name" });
    if (!dob) return void skipped.push({ name: label, reason: `date of birth "${dobRaw}" not understood (use DD-MM-YYYY)` });
    if (!grade) return void skipped.push({ name: label, reason: `class "${gradeRaw}" not understood (use Nursery, LKG, UKG or 1–12)` });
    const problem = eligibilityError(dob, grade);
    if (problem) return void skipped.push({ name: label, reason: problem.message });
    const phone = phoneRaw ? normalisePhone(phoneRaw) : null;
    rows.push({
      studentName: studentName.replace(/\s+/g, " ").slice(0, 60),
      dob,
      grade,
      phone,
      email: email && EMAIL_RE.test(email) ? email : null,
    });
  });
  if (rows.length && !(await roomFor(school.id, rows.length))) {
    return { message: `A school can register up to ${MAX_STUDENTS_PER_SCHOOL} students. Contact us for more.` };
  }
  const res = rows.length ? await createSchoolStudents(school, rows) : { added: [], skipped: [] };
  refresh();
  const all = [...skipped, ...res.skipped];
  return {
    ok: res.added.length > 0,
    message: `${res.added.length} student${res.added.length === 1 ? "" : "s"} added${all.length ? `, ${all.length} skipped` : ""}.`,
    added: res.added.map(({ regNo, name, pin }) => ({ regNo, name, pin })),
    skipped: all,
  };
}

export async function resetSchoolStudentPinAction(registrationId: string): Promise<{ pin?: string; error?: string }> {
  const school = await currentSchool();
  if (!school) return { error: "Please log in again." };
  const reg = await schoolStudent(school.id, registrationId);
  if (!reg) return { error: "Student not found." };
  const pin = randomDigits(6);
  await db
    .update(schema.registrations)
    .set({ pinHash: await hashSecret(pin), pinEnc: encryptPin(pin), failedLogins: 0, lockedUntil: null })
    .where(eq(schema.registrations.id, reg.id));
  refresh();
  return { pin };
}

export async function removeSchoolStudentAction(registrationId: string): Promise<{ error?: string }> {
  const school = await currentSchool();
  if (!school) return { error: "Please log in again." };
  const reg = await schoolStudent(school.id, registrationId);
  if (!reg) return { error: "Student not found." };
  if (await attemptFor(reg.id)) return { error: "This student has already taken the exam, so they can't be removed." };
  await db.delete(schema.emailLog).where(eq(schema.emailLog.registrationId, reg.id));
  await db.delete(schema.registrations).where(eq(schema.registrations.id, reg.id));
  refresh();
  return {};
}

/** Books one student's slot on the school's behalf. */
export async function schoolBookSlotAction(registrationId: string, slotId: string): Promise<{ error?: string }> {
  const school = await currentSchool();
  if (!school) return { error: "Please log in again." };
  const reg = await schoolStudent(school.id, registrationId);
  const slot = slotById(slotId);
  if (!reg || !slot) return { error: "Student or slot not found." };
  const now = Date.now();
  if (!canBookSlot(reg, await attemptFor(reg.id), now)) {
    return { error: reg.paymentStatus === "unpaid" || reg.paymentStatus === "rejected" ? "Submit the school payment first." : "This student's slot can't be changed any more." };
  }
  const res = await bookSlot(reg.id, slot, now);
  if ("error" in res) return { error: res.error };
  notifySlotBooked(reg.id);
  refresh();
  return {};
}

/** Form version of schoolBookSlotAction for the slot picker (bind the registration id). */
export async function schoolBookSlotFormAction(registrationId: string, _prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const r = await schoolBookSlotAction(registrationId, String(formData.get("slot") ?? ""));
  if (r.error) return { message: r.error };
  redirect("/schools/dashboard?booked=1");
}

/** Books one slot for many students at once (e.g. all of Class 3), as far as seats allow. */
export async function schoolBulkBookAction(_prev: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  const school = await schoolOrLogin();
  const slot = slotById(String(formData.get("slot") ?? ""));
  const grade = String(formData.get("grade") ?? "all");
  if (!slot) return { message: "Pick a slot." };
  if (school.paymentStatus === "unpaid" || school.paymentStatus === "rejected") return { message: "Submit the school payment first, then book slots." };
  const students = await db.query.registrations.findMany({
    where: and(
      eq(schema.registrations.schoolId, school.id),
      isNull(schema.registrations.slotStart),
      grade === "all" ? undefined : eq(schema.registrations.grade, grade),
    ),
  });
  if (!students.length) return { message: "Every matching student already has a slot." };
  const now = Date.now();
  let booked = 0;
  let firstError = "";
  for (const s of students) {
    if (!canBookSlot(s, await attemptFor(s.id), now)) continue;
    const res = await bookSlot(s.id, slot, now);
    if ("error" in res) {
      firstError = res.error;
      break;
    }
    booked++;
    notifySlotBooked(s.id);
  }
  refresh();
  const left = students.length - booked;
  if (!booked) return { message: firstError || "No students could be booked into this slot." };
  return {
    ok: true,
    message: `Booked ${booked} student${booked === 1 ? "" : "s"}.${left ? ` ${left} still need a slot${firstError ? " (this slot is now full)" : ""}.` : ""}`,
  };
}
