import { db } from "@/lib/db";
import { specialty } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Specialty } from "@/types";

export async function getAllSpecialties(): Promise<Specialty[]> {
  return db.select().from(specialty).orderBy(specialty.name);
}

export async function getSpecialtyById(
  id: string
): Promise<Specialty | undefined> {
  const results = await db
    .select()
    .from(specialty)
    .where(eq(specialty.id, id))
    .limit(1);
  return results[0];
}

export async function createSpecialty(data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Specialty> {
  const results = await db.insert(specialty).values(data).returning();
  return results[0];
}

export async function updateSpecialty(
  id: string,
  data: { name?: string; description?: string; icon?: string }
): Promise<Specialty | undefined> {
  const results = await db
    .update(specialty)
    .set(data)
    .where(eq(specialty.id, id))
    .returning();
  return results[0];
}

export async function deleteSpecialty(id: string): Promise<boolean> {
  const results = await db
    .delete(specialty)
    .where(eq(specialty.id, id))
    .returning();
  return results.length > 0;
}
