/**
 * Competition configuration — edit this file to rebrand or reschedule.
 * All dates are in IST (+05:30).
 */
/** The platform brand, shared by every championship we run. */
const brand = "Kudos Cup";
/** This championship. Change these two lines for the next one. */
const event = "Abacus Championship 2026";
const eventShort = "Abacus 2026";

export const site = {
  name: `${brand} ${event}`,
  shortName: brand,
  event,
  eventShort,
  /** Legal name on certificates and policies. Use your registered business name here if you have one. */
  organiser: brand,
  /** Shown on the home page, in the footer, in emails and as signatories on certificates. */
  founders: [
    { name: "Gagan", role: "Founder" },
    { name: "Vansh", role: "Co-founder" },
  ],
  /** The brand domain. Emails are sent from it. */
  domain: "kudoscup.com",
  tagline: "India's online abacus championship for Nursery to Class 12",
  regPrefix: "KC26",
  certPrefix: "KCC26",
  /** School account codes, e.g. KCS26-48213. */
  schoolPrefix: "KCS26",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    phone: "+91 95696 08101",
    whatsapp: "919569608101", // digits only, with country code
    email: "hello@kudoscup.com",
    city: "Ludhiana, Punjab",
  },
} as const;

export const schedule = {
  /** Age is calculated as on this date. */
  ageReferenceDate: "2026-12-01",
  examStart: "2026-12-01T00:00:00+05:30",
  examEnd: "2026-12-31T23:59:59+05:30",
  /** Winners announced at New Year midnight IST. */
  resultsAt: "2027-01-01T00:00:00+05:30",
} as const;

/**
 * Fees in rupees. The launch offer is real: from `offerEndsAt` new sign-ups pay the regular price.
 * Each registration stores the fee it was created with, so anyone who signed up during the offer keeps it.
 */
export const pricing = {
  individual: { regular: 499, offer: 10 },
  school: { regular: 9999, offer: 999 },
  offerEndsAt: "2026-12-25T23:59:59+05:30",
  currency: "INR",
} as const;

/** Exam slots: the exam can only be started during the hour a student booked. */
export const slotRules = {
  capacity: 100,
  minutes: 60,
  /** Share of seats taken before a slot is labelled "Filling fast". */
  fillingFastAt: 0.7,
} as const;

/** Server-only payment details (read from env so they never ship in code). */
export function upiDetails() {
  const vpa = process.env.UPI_ID?.trim() ?? "";
  return {
    vpa,
    payee: process.env.UPI_PAYEE_NAME ?? site.organiser,
    /** False until a real UPI ID is configured, so nobody can pay a placeholder ID. */
    ready: /^[\w.-]+@[\w.-]+$/.test(vpa) && !vpa.startsWith("yourname@"),
  };
}

/** Founders as "Gagan & Vansh". */
export function foundersLine() {
  return site.founders.map((f) => f.name).join(" & ");
}

export const prizes = [
  {
    id: "champion",
    title: "Champion",
    detail: "Gold e-trophy certificate, Hall of Fame spot and a surprise gift voucher for #1 in every class",
  },
  {
    id: "runners",
    title: "1st & 2nd Runner-up",
    detail: "Silver & Bronze certificates for #2 and #3 in every class",
  },
  {
    id: "distinction",
    title: "Distinction & Merit",
    detail: "Distinction for 90%+ scores, Merit for 75%+",
  },
  {
    id: "participation",
    title: "Every child",
    detail: "Verified e-certificate with QR code for every participant",
  },
] as const;

/**
 * Surprise prize for the toppers (user, 2026-11-19): the Champion (rank 1) of every class wins a gift voucher chosen by the
 * organiser, so up to 15 vouchers (one per class). Sent after the results to the contact details given at registration.
 */
export const toppersReward = {
  short: "Surprise gift vouchers for toppers",
  line: "The topper of every class wins a surprise gift voucher.",
  delivery:
    "After the results we send the voucher to the parent's registered email or mobile number (or through the school, for students it registered). We never ask for any payment, OTP or bank details to send it.",
} as const;

/** Age limits on the reference date. Each class also has its own allowed age range (see exam/papers.ts). */
export const MIN_AGE = 4;
export const MAX_AGE = 18;

export function ageOn(dob: string, ref: string = schedule.ageReferenceDate) {
  const [y, m, d] = dob.split("-").map(Number);
  const [ry, rm, rd] = ref.split("-").map(Number);
  let age = ry - y;
  if (rm < m || (rm === m && rd < d)) age--;
  return age;
}

export const times = {
  examStart: Date.parse(schedule.examStart),
  examEnd: Date.parse(schedule.examEnd),
  resultsAt: Date.parse(schedule.resultsAt),
};

/** Lets you take the real exam before 1 December for testing. Never enable in production. */
export function examTestMode() {
  return process.env.EXAM_TEST_MODE === "true";
}

export type Phase = "upcoming" | "live" | "closed" | "results";

export function phaseAt(now: number): Phase {
  if (now < times.examStart) return "upcoming";
  if (now <= times.examEnd) return "live";
  if (now < times.resultsAt) return "closed";
  return "results";
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Outside India",
] as const;
