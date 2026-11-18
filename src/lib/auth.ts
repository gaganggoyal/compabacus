import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "./db";
import { getStudentId, isAdmin } from "./session";

export async function currentStudent() {
  const id = await getStudentId();
  if (!id) return null;
  const reg = await db.query.registrations.findFirst({ where: eq(schema.registrations.id, id) });
  return reg ?? null;
}

export async function requireStudent() {
  const reg = await currentStudent();
  if (!reg) redirect("/login");
  return reg;
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Not authorised");
}
