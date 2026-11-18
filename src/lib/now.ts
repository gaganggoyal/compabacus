import "server-only";
import { connection } from "next/server";

/** Current time for a request. Defers rendering to request time so the value is never baked into a prerender. */
export async function requestNow() {
  await connection();
  return Date.now();
}
