// Nightly SQLite backup: a consistent copy via VACUUM INTO, keeping the last 14 days.
// Run from the app directory:  node scripts/backup-db.mjs
// Uses DATABASE_URL (file:...) and BACKUP_DIR (default /var/backups/kudoscup).
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
if (!url?.startsWith("file:")) {
  console.error("DATABASE_URL must be a file: URL");
  process.exit(1);
}
const dir = process.env.BACKUP_DIR ?? "/var/backups/kudoscup";
const keepDays = Number(process.env.BACKUP_KEEP_DAYS ?? 14);
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const target = path.join(dir, `abacus-${stamp}.db`);
const client = createClient({ url });
await client.execute({ sql: "VACUUM INTO ?", args: [target] });
client.close();
console.log(`backup written: ${target} (${fs.statSync(target).size} bytes)`);

const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
for (const f of fs.readdirSync(dir)) {
  const p = path.join(dir, f);
  if (/^abacus-\d{12}\.db$/.test(f) && fs.statSync(p).mtimeMs < cutoff) {
    fs.unlinkSync(p);
    console.log(`old backup removed: ${f}`);
  }
}
