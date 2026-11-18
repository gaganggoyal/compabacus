import "server-only";
import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
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
