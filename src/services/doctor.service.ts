import { db } from "@/lib/db";
import { doctorProfile, doctorAvailability, doctorTimeOff, user, specialty } from "@/db/schema";
import { eq, and, ilike, sql, count } from "drizzle-orm";
import type { DoctorListItem } from "@/types";

export async function getDoctorProfile(userId: string) {
  const results = await db
    .select()
    .from(doctorProfile)
    .innerJoin(user, eq(doctorProfile.userId, user.id))
    .innerJoin(specialty, eq(doctorProfile.specialtyId, specialty.id))
    .where(eq(doctorProfile.userId, userId))
    .limit(1);

  if (results.length === 0) return null;
  const row = results[0];
  return {
    ...row.doctor_profile,
    user: row.user,
    specialty: row.specialty,
  };
}

export async function getDoctorProfileById(doctorId: string) {
  const results = await db
    .select()
    .from(doctorProfile)
    .innerJoin(user, eq(doctorProfile.userId, user.id))
    .innerJoin(specialty, eq(doctorProfile.specialtyId, specialty.id))
    .where(eq(doctorProfile.id, doctorId))
    .limit(1);

  if (results.length === 0) return null;
  const row = results[0];
  return {
    ...row.doctor_profile,
    user: row.user,
    specialty: row.specialty,
  };
}

export async function searchDoctors(params: {
  specialtyId?: string;
  search?: string;
  page: number;
  limit: number;
}): Promise<{ items: DoctorListItem[]; total: number }> {
  const { specialtyId, search, page, limit } = params;
  const offset = (page - 1) * limit;

  const conditions = [eq(doctorProfile.isAcceptingPatients, true)];

  if (specialtyId) {
    conditions.push(eq(doctorProfile.specialtyId, specialtyId));
  }

  const baseQuery = db
    .select({
      id: doctorProfile.id,
      userId: doctorProfile.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      specialtyName: specialty.name,
      specialtyId: doctorProfile.specialtyId,
      bio: doctorProfile.bio,
      qualifications: doctorProfile.qualifications,
      experienceYears: doctorProfile.experienceYears,
      consultationFee: doctorProfile.consultationFee,
      hospitalAffiliation: doctorProfile.hospitalAffiliation,
      isAcceptingPatients: doctorProfile.isAcceptingPatients,
      averageRating: doctorProfile.averageRating,
      totalReviews: doctorProfile.totalReviews,
    })
    .from(doctorProfile)
    .innerJoin(user, eq(doctorProfile.userId, user.id))
    .innerJoin(specialty, eq(doctorProfile.specialtyId, specialty.id));

  let query = baseQuery.where(and(...conditions));

  if (search) {
    query = baseQuery.where(
      and(...conditions, ilike(user.name, `%${search}%`))
    );
  }

  const [items, totalResult] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(doctorProfile.averageRating),
    db
      .select({ count: count() })
      .from(doctorProfile)
      .innerJoin(user, eq(doctorProfile.userId, user.id))
      .where(and(...conditions)),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function createDoctorProfile(data: {
  userId: string;
  specialtyId: string;
  bio?: string;
  qualifications?: string;
  experienceYears: number;
  consultationFee: number;
  hospitalAffiliation?: string;
  isAcceptingPatients?: boolean;
}) {
  const results = await db
    .insert(doctorProfile)
    .values({
      ...data,
      consultationFee: data.consultationFee.toString(),
    })
    .returning();
  return results[0];
}

export async function updateDoctorProfile(
  doctorId: string,
  data: Partial<{
    specialtyId: string;
    bio: string;
    qualifications: string;
    experienceYears: number;
    consultationFee: number;
    hospitalAffiliation: string;
    isAcceptingPatients: boolean;
  }>
) {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.consultationFee !== undefined) {
    updateData.consultationFee = data.consultationFee.toString();
  }
  const results = await db
    .update(doctorProfile)
    .set(updateData)
    .where(eq(doctorProfile.id, doctorId))
    .returning();
  return results[0];
}

// ─── Availability ───────────────────────────────────────────────────

export async function getDoctorAvailability(doctorId: string) {
  return db
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, doctorId),
        eq(doctorAvailability.isActive, true)
      )
    )
    .orderBy(doctorAvailability.dayOfWeek, doctorAvailability.startTime);
}

export async function setDoctorAvailability(
  doctorId: string,
  data: {
    dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    startTime: string;
    endTime: string;
    slotDurationMinutes?: number;
  }
) {
  const results = await db
    .insert(doctorAvailability)
    .values({
      doctorId,
      ...data,
    })
    .returning();
  return results[0];
}

export async function removeDoctorAvailability(
  availabilityId: string,
  doctorId: string
) {
  const results = await db
    .delete(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.id, availabilityId),
        eq(doctorAvailability.doctorId, doctorId)
      )
    )
    .returning();
  return results.length > 0;
}

// ─── Time Off ───────────────────────────────────────────────────────

export async function getDoctorTimeOffs(doctorId: string) {
  return db
    .select()
    .from(doctorTimeOff)
    .where(eq(doctorTimeOff.doctorId, doctorId))
    .orderBy(doctorTimeOff.startDate);
}

export async function addDoctorTimeOff(
  doctorId: string,
  data: { startDate: string; endDate: string; reason?: string }
) {
  const results = await db
    .insert(doctorTimeOff)
    .values({ doctorId, ...data })
    .returning();
  return results[0];
}

export async function removeDoctorTimeOff(
  timeOffId: string,
  doctorId: string
) {
  const results = await db
    .delete(doctorTimeOff)
    .where(
      and(
        eq(doctorTimeOff.id, timeOffId),
        eq(doctorTimeOff.doctorId, doctorId)
      )
    )
    .returning();
  return results.length > 0;
}

export async function updateDoctorRating(doctorId: string) {
  await db.execute(sql`
    UPDATE doctor_profile
    SET average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM review
      WHERE doctor_id = ${doctorId}
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM review
      WHERE doctor_id = ${doctorId}
    ),
    updated_at = NOW()
    WHERE id = ${doctorId}
  `);
}
