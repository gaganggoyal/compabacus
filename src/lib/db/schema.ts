import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const PAYMENT_STATUSES = ["unpaid", "submitted", "verified", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ATTEMPT_STATUSES = ["in_progress", "submitted", "disqualified"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const AWARDS = ["champion", "runner_up_1", "runner_up_2", "distinction", "merit", "participation"] as const;
export type Award = (typeof AWARDS)[number];

export const registrations = sqliteTable(
  "registrations",
  {
    id: text("id").primaryKey(),
    regNo: text("reg_no").notNull().unique(),
    studentName: text("student_name").notNull(),
    dob: text("dob").notNull(),
    gender: text("gender"),
    /** School class id from exam/papers.ts (NUR, LKG, UKG, C1…C12). Decides the paper and the ranking category. */
    grade: text("grade").notNull(),
    school: text("school"),
    parentName: text("parent_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    country: text("country").notNull().default("India"),
    pinHash: text("pin_hash").notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("unpaid"),
    utr: text("utr").unique(),
    paymentSubmittedAt: integer("payment_submitted_at", { mode: "timestamp_ms" }),
    paymentVerifiedAt: integer("payment_verified_at", { mode: "timestamp_ms" }),
    paymentNote: text("payment_note"),
    failedLogins: integer("failed_logins").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
    /** SHA-256 of the emailed "set a new PIN" token. Single use; cleared once used. */
    pinResetHash: text("pin_reset_hash"),
    pinResetExpires: integer("pin_reset_expires", { mode: "timestamp_ms" }),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("reg_phone_idx").on(t.phone),
    index("reg_payment_idx").on(t.paymentStatus),
    index("reg_grade_idx").on(t.grade),
    index("reg_created_idx").on(t.createdAt),
  ],
);

export const attempts = sqliteTable(
  "attempts",
  {
    id: text("id").primaryKey(),
    registrationId: text("registration_id")
      .notNull()
      .unique()
      .references(() => registrations.id, { onDelete: "cascade" }),
    grade: text("grade").notNull(),
    seed: integer("seed").notNull(),
    paper: text("paper").notNull(),
    answers: text("answers").notNull().default("{}"),
    status: text("status", { enum: ATTEMPT_STATUSES }).notNull().default("in_progress"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    deadlineAt: integer("deadline_at", { mode: "timestamp_ms" }).notNull(),
    lastSavedAt: integer("last_saved_at", { mode: "timestamp_ms" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    score: integer("score"),
    maxScore: integer("max_score"),
    timeTakenMs: integer("time_taken_ms"),
    focusLosses: integer("focus_losses").notNull().default(0),
    flagged: integer("flagged", { mode: "boolean" }).notNull().default(false),
    adminNote: text("admin_note"),
    rank: integer("rank"),
    award: text("award", { enum: AWARDS }),
    certNo: text("cert_no").unique(),
  },
  (t) => [index("attempt_status_idx").on(t.status), index("attempt_grade_idx").on(t.grade)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const EMAIL_KINDS = ["registered", "payment_verified", "payment_rejected", "exam_submitted", "results", "pin_reset", "test"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

export const EMAIL_STATUSES = ["sent", "failed", "skipped"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/** Every email the site tried to send, for the organiser panel and to avoid sending results twice. */
export const emailLog = sqliteTable(
  "email_log",
  {
    id: text("id").primaryKey(),
    registrationId: text("registration_id").references(() => registrations.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: EMAIL_KINDS }).notNull(),
    to: text("to_addr").notNull(),
    subject: text("subject").notNull(),
    status: text("status", { enum: EMAIL_STATUSES }).notNull(),
    providerId: text("provider_id"),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("email_reg_kind_idx").on(t.registrationId, t.kind), index("email_created_idx").on(t.createdAt)],
);

export type Registration = typeof registrations.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
