import { db } from "@/lib/db";
import { user, doctorProfile, appointment } from "@/db/schema";
import { eq, count, sql, and } from "drizzle-orm";
import type { AdminStats } from "@/types";

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalUsersResult,
    totalDoctorsResult,
    totalAppointmentsResult,
    upcomingResult,
    completedResult,
    cancelledResult,
    revenueResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(doctorProfile),
    db.select({ count: count() }).from(appointment),
    db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.status, "scheduled"),
        )
      ),
    db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, "completed")),
    db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, "cancelled")),
    db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(dp.consultation_fee AS NUMERIC)), 0)`,
      })
      .from(appointment)
      .innerJoin(doctorProfile, eq(appointment.doctorId, doctorProfile.id))
      .where(eq(appointment.status, "completed")),
  ]);

  const totalUsers = totalUsersResult[0]?.count ?? 0;
  const totalDoctors = totalDoctorsResult[0]?.count ?? 0;

  return {
    totalUsers,
    totalDoctors,
    totalPatients: totalUsers - totalDoctors,
    totalAppointments: totalAppointmentsResult[0]?.count ?? 0,
    upcomingAppointments: upcomingResult[0]?.count ?? 0,
    completedAppointments: completedResult[0]?.count ?? 0,
    cancelledAppointments: cancelledResult[0]?.count ?? 0,
    totalRevenue: Number(revenueResult[0]?.total ?? 0),
  };
}

export async function getAllUsers(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const [items, totalResult] = await Promise.all([
    db.select().from(user).limit(limit).offset(offset).orderBy(user.createdAt),
    db.select({ count: count() }).from(user),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function updateUserRole(
  userId: string,
  role: "patient" | "doctor" | "admin"
) {
  const results = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  return results[0] || null;
}

export async function deleteUser(userId: string) {
  const results = await db
    .delete(user)
    .where(eq(user.id, userId))
    .returning();
  return results.length > 0;
}
