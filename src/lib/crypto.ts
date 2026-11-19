import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(secret, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(secret, Buffer.from(saltHex, "hex"), 32);
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function randomDigits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += randomInt(0, 10).toString();
  return s;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomCode(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += ALPHABET[randomInt(0, ALPHABET.length)];
  return s;
}

export function newId() {
  return crypto.randomUUID();
}

export function randomSeed() {
  return randomInt(1, 2 ** 31 - 1);
}

/** AES-256-GCM key for PINs of school-registered students, derived from SESSION_SECRET. */
function pinKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return createHash("sha256").update(`kudoscup-pin-v1:${secret}`).digest();
}

/** Encrypts a PIN so the school that registered the student can print it later. Logins still check the scrypt hash. */
export function encryptPin(pin: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", pinKey(), iv);
  const enc = Buffer.concat([c.update(pin, "utf8"), c.final()]);
  return ["v1", iv, enc, c.getAuthTag()].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(":");
}

export function decryptPin(stored: string | null | undefined) {
  if (!stored) return null;
  try {
    const [v, iv, enc, tag] = stored.split(":");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", pinKey(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
