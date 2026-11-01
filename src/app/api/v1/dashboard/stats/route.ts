import { requireAuth, apiSuccess, withErrorHandler } from "@/lib/server-utils";
import { getAdminStats } from "@/services/admin.service";
import { getDoctorProfile } from "@/services/doctor.service";
import { db } from "@/lib/db";
import { appointment } from "@/db/schema";
import { eq, count, and, or } from "drizzle-orm";

export const GET = withErrorHandler(async () => {
  const session = await requireAuth();
  const role = (session.user as unknown as { role: string }).role;

  if (role === "admin") {
    const stats = await getAdminStats();
    return apiSuccess(stats);
  }

  if (role === "doctor") {
    const profile = await getDoctorProfile(session.user.id);
    if (!profile) {
      return apiSuccess({
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0,
        totalPatients: 0,
        averageRating: 5.0,
        totalReviews: 0,
        todayAppointments: 0,
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const [
      totalRes,
      upcomingRes,
      completedRes,
      todayRes,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(appointment)
        .where(eq(appointment.doctorId, profile.id)),
      db
        .select({ count: count() })
        .from(appointment)
        .where(
          and(
            eq(appointment.doctorId, profile.id),
            or(
              eq(appointment.status, "scheduled"),
              eq(appointment.status, "confirmed")
            )
          )
        ),
      db
        .select({ count: count() })
        .from(appointment)
        .where(
          and(
            eq(appointment.doctorId, profile.id),
            eq(appointment.status, "completed")
          )
        ),
      db
        .select({ count: count() })
        .from(appointment)
        .where(
          and(
            eq(appointment.doctorId, profile.id),
            eq(appointment.appointmentDate, todayStr)
          )
        ),
    ]);

    return apiSuccess({
      totalAppointments: totalRes[0]?.count ?? 0,
      upcomingAppointments: upcomingRes[0]?.count ?? 0,
      completedAppointments: completedRes[0]?.count ?? 0,
      totalPatients: completedRes[0]?.count ?? 0,
      averageRating: profile.averageRating ? parseFloat(profile.averageRating) : 5.0,
      totalReviews: profile.totalReviews || 0,
      todayAppointments: todayRes[0]?.count ?? 0,
    });
  }

  // Patient stats
  const [totalRes, upcomingRes, completedRes] = await Promise.all([
    db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.patientId, session.user.id)),
    db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.patientId, session.user.id),
          or(
            eq(appointment.status, "scheduled"),
            eq(appointment.status, "confirmed")
          )
        )
      ),
    db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.patientId, session.user.id),
          eq(appointment.status, "completed")
        )
      ),
  ]);

  return apiSuccess({
    totalAppointments: totalRes[0]?.count ?? 0,
    upcomingAppointments: upcomingRes[0]?.count ?? 0,
    completedAppointments: completedRes[0]?.count ?? 0,
    totalDoctorsVisited: completedRes[0]?.count ?? 0,
  });
});
