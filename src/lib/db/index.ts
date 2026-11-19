import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { libsql?: Client };

function makeClient() {
  const url = process.env.DATABASE_URL ?? "file:local.db";
  const c = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  if (url.startsWith("file:")) {
    // WAL lets page reads and the nightly backup run while exam answers are being saved.
    void c.execute("PRAGMA journal_mode = WAL").catch(() => {});
    void c.execute("PRAGMA busy_timeout = 5000").catch(() => {});
  }
  return c;
}

const client = globalForDb.libsql ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
