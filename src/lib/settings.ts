import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";

export type ResultsMode = "auto" | "published" | "hidden";

export async function getSetting(key: string) {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}

export async function getResultsMode(): Promise<ResultsMode> {
  const v = await getSetting("results_mode");
  return v === "published" || v === "hidden" ? v : "auto";
}
