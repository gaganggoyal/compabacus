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
    ageGroup: text("age_group").notNull(),
    level: text("level").notNull(),
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
    consentAt: integer("consent_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("reg_phone_idx").on(t.phone),
    index("reg_payment_idx").on(t.paymentStatus),
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
    level: text("level").notNull(),
    ageGroup: text("age_group").notNull(),
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
  (t) => [index("attempt_status_idx").on(t.status), index("attempt_cat_idx").on(t.ageGroup, t.level)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
