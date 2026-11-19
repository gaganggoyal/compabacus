import "server-only";
import { cacheLife } from "next/cache";
import { displayPrice, offerLive } from "./pricing";

/**
 * Current prices for server-rendered pages. Cached briefly so pages can stay static,
 * yet switch to the regular price within minutes of the offer ending (no redeploy needed).
 */
export async function pricingSnapshot() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  const now = Date.now();
  return {
    offerLive: offerLive(now),
    individual: displayPrice("individual", now),
    school: displayPrice("school", now),
  };
}
