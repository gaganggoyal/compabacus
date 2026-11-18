import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const STUDENT_COOKIE = "as_student";
const ADMIN_COOKIE = "as_admin";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, unknown>, subject: string, ttlSec: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec)
    .sign(key());
}

async function verify(token: string | undefined, role: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role !== role || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setStudentSession(registrationId: string) {
  const ttl = 60 * 60 * 24 * 60; // 60 days — covers the whole event
  const token = await sign({ role: "student" }, registrationId, ttl);
  (await cookies()).set(STUDENT_COOKIE, token, { ...cookieBase, maxAge: ttl });
}

export async function getStudentId() {
  return verify((await cookies()).get(STUDENT_COOKIE)?.value, "student");
}

export async function clearStudentSession() {
  (await cookies()).delete(STUDENT_COOKIE);
}

export async function setAdminSession() {
  const ttl = 60 * 60 * 12;
  const token = await sign({ role: "admin" }, "admin", ttl);
  (await cookies()).set(ADMIN_COOKIE, token, { ...cookieBase, maxAge: ttl });
}

export async function isAdmin() {
  return (await verify((await cookies()).get(ADMIN_COOKIE)?.value, "admin")) === "admin";
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
