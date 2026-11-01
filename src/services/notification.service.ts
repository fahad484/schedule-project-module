import { db } from "@/lib/db";
import { notification } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

type NotificationType =
  | "appointment_booked"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "appointment_reminder"
  | "review_received"
  | "general";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: string;
}) {
  const results = await db.insert(notification).values(data).returning();
  return results[0];
}

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const [items, totalResult, unreadResult] = await Promise.all([
    db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(notification.createdAt)),
    db
      .select({ count: count() })
      .from(notification)
      .where(eq(notification.userId, userId)),
    db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, userId),
          eq(notification.isRead, false)
        )
      ),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
    unread: unreadResult[0]?.count ?? 0,
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const results = await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId)
      )
    )
    .returning();

  return results[0] || null;
}

export async function markAllNotificationsAsRead(userId: string) {
  await db
    .update(notification)
    .set({ isRead: true })
    .where(
      and(
        eq(notification.userId, userId),
        eq(notification.isRead, false)
      )
    );
}

export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  const results = await db
    .delete(notification)
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.userId, userId)
      )
    )
    .returning();

  return results.length > 0;
}

// ─── Notification Helpers ───────────────────────────────────────────

export async function notifyAppointmentBooked(
  patientId: string,
  doctorUserId: string,
  appointmentDate: string,
  time: string,
  doctorName: string,
  patientName: string
) {
  await Promise.all([
    createNotification({
      userId: patientId,
      type: "appointment_booked",
      title: "Appointment Booked",
      message: `Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${time} has been booked.`,
    }),
    createNotification({
      userId: doctorUserId,
      type: "appointment_booked",
      title: "New Appointment",
      message: `${patientName} has booked an appointment on ${appointmentDate} at ${time}.`,
    }),
  ]);
}

export async function notifyAppointmentCancelled(
  patientId: string,
  doctorUserId: string,
  appointmentDate: string,
  cancelledByName: string
) {
  await Promise.all([
    createNotification({
      userId: patientId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Your appointment on ${appointmentDate} has been cancelled by ${cancelledByName}.`,
    }),
    createNotification({
      userId: doctorUserId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `The appointment on ${appointmentDate} has been cancelled by ${cancelledByName}.`,
    }),
  ]);
}
