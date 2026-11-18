/**
 * Competition configuration — edit this file to rebrand or reschedule.
 * All dates are in IST (+05:30).
 */
export const site = {
  name: "Abacus Stars Championship 2026",
  shortName: "Abacus Stars",
  organiser: "Abacus Stars Academy",
  tagline: "India's ₹10 online abacus championship for ages 4–18",
  regPrefix: "AS26",
  certPrefix: "ASC26",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    phone: "+91 90000 00000",
    whatsapp: "919000000000", // digits only, with country code
    email: "hello@example.com",
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

export const fee = {
  amount: 10,
  currency: "INR",
};

/** Server-only payment details (read from env so they never ship in code). */
export function upiDetails() {
  return {
    vpa: process.env.UPI_ID ?? "yourname@upi",
    payee: process.env.UPI_PAYEE_NAME ?? site.organiser,
  };
}

export const prizes = [
  {
    id: "champion",
    title: "Champion",
    detail: "Gold e-trophy certificate + Hall of Fame spot for #1 in every category",
  },
  {
    id: "runners",
    title: "1st & 2nd Runner-up",
    detail: "Silver & Bronze certificates for #2 and #3 in every category",
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

export const AGE_GROUPS = [
  { id: "A", label: "Little Champs", min: 4, max: 6 },
  { id: "B", label: "Rising Stars", min: 7, max: 8 },
  { id: "C", label: "Bright Sparks", min: 9, max: 10 },
  { id: "D", label: "Quick Thinkers", min: 11, max: 12 },
  { id: "E", label: "Mind Masters", min: 13, max: 14 },
  { id: "F", label: "Grand Achievers", min: 15, max: 18 },
] as const;

export type AgeGroupId = (typeof AGE_GROUPS)[number]["id"];

export const MIN_AGE = AGE_GROUPS[0].min;
export const MAX_AGE = AGE_GROUPS[AGE_GROUPS.length - 1].max;

export function ageOn(dob: string, ref: string = schedule.ageReferenceDate) {
  const [y, m, d] = dob.split("-").map(Number);
  const [ry, rm, rd] = ref.split("-").map(Number);
  let age = ry - y;
  if (rm < m || (rm === m && rd < d)) age--;
  return age;
}

export function ageGroupFor(dob: string) {
  const age = ageOn(dob);
  return AGE_GROUPS.find((g) => age >= g.min && age <= g.max) ?? null;
}

export function ageGroupById(id: string) {
  return AGE_GROUPS.find((g) => g.id === id);
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
