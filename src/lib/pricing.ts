import { pricing } from "./config";

/** Safe for client components: plain functions, no server imports. */
export type Plan = "individual" | "school";

export const OFFER_END = Date.parse(pricing.offerEndsAt);
/** Pages are cached for a few minutes, so a sign-up made shortly after the deadline still gets the price it was shown. */
const OFFER_GRACE_MS = 60 * 60 * 1000;

export function offerLive(now: number) {
  return now <= OFFER_END;
}

/** The price to show at `now`. */
export function displayPrice(plan: Plan, now: number) {
  return offerLive(now) ? pricing[plan].offer : pricing[plan].regular;
}

/** The fee charged for a sign-up made at `now`. Stored on the registration, so it never changes afterwards. */
export function chargeFor(plan: Plan, now: number) {
  return now <= OFFER_END + OFFER_GRACE_MS ? pricing[plan].offer : pricing[plan].regular;
}

/** "98%" for ₹499 → ₹10. */
export function savingPercent(plan: Plan) {
  const p = pricing[plan];
  return Math.round((1 - p.offer / p.regular) * 100);
}

/** "25 Dec" */
export const OFFER_END_LABEL = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(OFFER_END);

export function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
