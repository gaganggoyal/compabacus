import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "./db";
import { getSchoolId, getStudentId, isAdmin } from "./session";

export async function currentSchool() {
  const id = await getSchoolId();
  if (!id) return null;
  return (await db.query.schools.findFirst({ where: eq(schema.schools.id, id) })) ?? null;
}

export async function requireSchool() {
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  return school;
}

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
