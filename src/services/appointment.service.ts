import { db } from "@/lib/db";
import {
  appointment,
  doctorProfile,
  doctorAvailability,
  doctorTimeOff,
  user,
  specialty,
} from "@/db/schema";
import { eq, and, count, ne, desc, gte, lte, or } from "drizzle-orm";
import { getDayOfWeek, generateTimeSlots } from "@/lib/utils";
import type { TimeSlot } from "@/types";

import { notifyAppointmentBooked } from "@/services/notification.service";





/**
 * Get available time slots for a doctor on a specific date.
 * Checks weekly availability, time-offs, and existing appointments.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string
): Promise<TimeSlot[]> {
  const dayOfWeek = getDayOfWeek(new Date(date));

  // Get doctor's weekly availability for this day
  const availabilities = await db
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, doctorId),
        eq(doctorAvailability.dayOfWeek, dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"),
        eq(doctorAvailability.isActive, true)
      )
    );

  if (availabilities.length === 0) return [];

  // Check if doctor has time off on this date
  const timeOffs = await db
    .select()
    .from(doctorTimeOff)
    .where(
      and(
        eq(doctorTimeOff.doctorId, doctorId),
        lte(doctorTimeOff.startDate, date),
        gte(doctorTimeOff.endDate, date)
      )
    );

  if (timeOffs.length > 0) return [];

  // Get existing appointments for this date (non-cancelled)
  const existingAppointments = await db
    .select({
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    })
    .from(appointment)
    .where(
      and(
        eq(appointment.doctorId, doctorId),
        eq(appointment.appointmentDate, date),
        ne(appointment.status, "cancelled")
      )
    );

  const bookedTimes = new Set(
    existingAppointments.map((a) => a.startTime)
  );

  // Generate all possible slots and mark availability
  const allSlots: TimeSlot[] = [];
  for (const avail of availabilities) {
    const slots = generateTimeSlots(
      avail.startTime,
      avail.endTime,
      avail.slotDurationMinutes
    );
    // for (const slot of slots) {
    //   allSlots.push({
    //     ...slot,
    //     isAvailable: !bookedTimes.has(slot.start),
    //   });
    // }
    for (const slot of slots) {
       const isBooked = bookedTimes.has(slot.start);

      allSlots.push({
        ...slot,
        isBooked,
        isAvailable: !isBooked,
      });
    }
  }

  return allSlots;
}

/**
 * Book an appointment with double-booking prevention using
 * a unique constraint on (doctor_id, appointment_date, start_time).
 * The database will reject concurrent inserts for the same slot.
 */
export async function bookAppointment(data: {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  // Verify the doctor exists and is accepting patients
  const doctor = await db
    .select()
    .from(doctorProfile)
    .where(eq(doctorProfile.id, data.doctorId))
    .limit(1);

  if (!doctor[0]) {
    throw new Error("Doctor not found");
  }

  if (!doctor[0].isAcceptingPatients) {
    throw new Error("Doctor is not currently accepting patients");
  }

  // Verify the date is not in the past
  const appointmentDate = new Date(data.appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new Error("Cannot book appointments in the past");
  }

  // Verify the day of week has availability
  const dayOfWeek = getDayOfWeek(appointmentDate);
  const availabilities = await db
    .select()
    .from(doctorAvailability)
    .where(
      and(
        eq(doctorAvailability.doctorId, data.doctorId),
        eq(doctorAvailability.dayOfWeek, dayOfWeek as "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"),
        eq(doctorAvailability.isActive, true)
      )
    );

  if (availabilities.length === 0) {
    throw new Error("Doctor is not available on this day");
  }



  // Verify the time slot falls within availability
  const isValidSlot = availabilities.some((avail) => {
    return data.startTime >= avail.startTime && data.endTime <= avail.endTime;
  });

  if (!isValidSlot) {
    throw new Error("Selected time is outside doctor's available hours");
  }

  // Check for time off
  const timeOffs = await db
    .select()
    .from(doctorTimeOff)
    .where(
      and(
        eq(doctorTimeOff.doctorId, data.doctorId),
        lte(doctorTimeOff.startDate, data.appointmentDate),
        gte(doctorTimeOff.endDate, data.appointmentDate)
      )
    );

  if (timeOffs.length > 0) {
    throw new Error("Doctor is on leave on this date");
  }

    console.log("Booking doctorId:", data.doctorId);
    console.log("Appointment date:", appointmentDate);
    console.log("Calculated weekday:", dayOfWeek);
    console.log("Availability records:", availabilities);

  // Check if patient already has an appointment at this time
  const patientConflict = await db
    .select()
    .from(appointment)
    .where(
      and(
        eq(appointment.patientId, data.patientId),
        eq(appointment.appointmentDate, data.appointmentDate),
        eq(appointment.startTime, data.startTime),
        ne(appointment.status, "cancelled")
      )
    )
    .limit(1);

  if (patientConflict.length > 0) {
    throw new Error("You already have an appointment at this time");
  }

  // Insert the appointment - the unique constraint on
  // (doctor_id, appointment_date, start_time) prevents double-booking
  // even under concurrent requests
  try {
    // const results = await db
    //   .insert(appointment)
    //   .values({
    //     patientId: data.patientId,
    //     doctorId: data.doctorId,
    //     appointmentDate: data.appointmentDate,
    //     startTime: data.startTime,
    //     endTime: data.endTime,
    //     reason: data.reason,
    //     status: "scheduled",
    //   })
    //   .returning();

    // return results[0];

        const results = await db
      .insert(appointment)
      .values({
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        status: "scheduled",
      })
      .returning();

    const bookedAppointment = results[0];

    // Create notifications after successful appointment booking
    try {
      const [patientUser, doctorUser] = await Promise.all([
        db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, data.patientId))
          .limit(1),

        db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, doctor[0].userId))
          .limit(1),
      ]);

      await notifyAppointmentBooked(
        data.patientId,
        doctor[0].userId,
        data.appointmentDate,
        data.startTime,
        doctorUser[0]?.name ?? "Doctor",
        patientUser[0]?.name ?? "Patient"
      );
    } catch (notificationError) {
      console.error(
        "Appointment booked, but notification creation failed:",
        notificationError
      );
    }

    return bookedAppointment;
  // } catch (error: unknown) {
  //   // Handle unique constraint violation (concurrent booking attempt)
  //   if (
  //     error instanceof Error &&
  //     error.message.includes("unique") 
  //   ) {
  //     throw new Error(
  //       "This time slot was just booked by another patient. Please select a different time."
  //     );
  //   }
  //   throw error;
  // }
    } catch (error: unknown) {
    const dbError = error as {
      code?: string;
      constraint?: string;
      cause?: {
        code?: string;
        constraint?: string;
      };
    };

    const errorCode = dbError.code ?? dbError.cause?.code;
    const constraint =
      dbError.constraint ?? dbError.cause?.constraint;

    console.error("Appointment insert failed:", {
      code: errorCode,
      constraint,
      error,
    });

    if (errorCode === "23505") {
      throw new Error(
        "Already booked slot. Please select a different time slot."
      );
    }

    throw error;
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string,
  reason: string
) {
  const existing = await db
    .select()
    .from(appointment)
    .where(eq(appointment.id, appointmentId))
    .limit(1);

  if (!existing[0]) {
    throw new Error("Appointment not found");
  }

  if (existing[0].status === "cancelled") {
    throw new Error("Appointment is already cancelled");
  }

  if (existing[0].status === "completed") {
    throw new Error("Cannot cancel a completed appointment");
  }

  const results = await db
    .update(appointment)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(appointment.id, appointmentId))
    .returning();

  return results[0];
}

/**
 * Reschedule an appointment - cancel old and create new
 */
export async function rescheduleAppointment(
  appointmentId: string,
  userId: string,
  newData: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
  }
) {
  const existing = await db
    .select()
    .from(appointment)
    .where(eq(appointment.id, appointmentId))
    .limit(1);

  if (!existing[0]) {
    throw new Error("Appointment not found");
  }

  if (existing[0].status === "cancelled" || existing[0].status === "completed") {
    throw new Error("Cannot reschedule this appointment");
  }

  // Cancel the existing appointment
  await db
    .update(appointment)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: "Rescheduled",
      updatedAt: new Date(),
    })
    .where(eq(appointment.id, appointmentId));

  // Book the new appointment
  return bookAppointment({
    patientId: existing[0].patientId,
    doctorId: existing[0].doctorId,
    appointmentDate: newData.appointmentDate,
    startTime: newData.startTime,
    endTime: newData.endTime,
    reason: existing[0].reason || "Rescheduled appointment",
  });
}

/**
 * Confirm an appointment (doctor action)
 */
export async function confirmAppointment(appointmentId: string) {
  const results = await db
    .update(appointment)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(
      and(
        eq(appointment.id, appointmentId),
        eq(appointment.status, "scheduled")
      )
    )
    .returning();

  if (results.length === 0) {
    throw new Error("Appointment not found or cannot be confirmed");
  }

  return results[0];
}

/**
 * Complete an appointment (doctor action)
 */
export async function completeAppointment(
  appointmentId: string,
  notes?: string
) {
  const results = await db
    .update(appointment)
    .set({
      status: "completed",
      notes: notes || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(appointment.id, appointmentId),
        or(
          eq(appointment.status, "scheduled"),
          eq(appointment.status, "confirmed")
        )
      )
    )
    .returning();

  if (results.length === 0) {
    throw new Error("Appointment not found or cannot be completed");
  }

  return results[0];
}

/**
 * Get appointments for a patient
 */
export async function getPatientAppointments(
  patientId: string,
  status?: string
) {
  const conditions = [eq(appointment.patientId, patientId)];

  if (status && status !== "all") {
    conditions.push(
      eq(
        appointment.status,
        status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
      )
    );
  }

  return db
    .select({
      appointment: appointment,
      doctorName: user.name,
      doctorEmail: user.email,
      doctorImage: user.image,
      specialtyName: specialty.name,
      consultationFee: doctorProfile.consultationFee,
    })
    .from(appointment)
    .innerJoin(doctorProfile, eq(appointment.doctorId, doctorProfile.id))
    .innerJoin(user, eq(doctorProfile.userId, user.id))
    .innerJoin(specialty, eq(doctorProfile.specialtyId, specialty.id))
    .where(and(...conditions))
    .orderBy(desc(appointment.appointmentDate), desc(appointment.startTime));
}

/**
 * Get appointments for a doctor
 */
export async function getDoctorAppointments(
  doctorId: string,
  status?: string,
  date?: string
) {
  const conditions = [eq(appointment.doctorId, doctorId)];

  if (status && status !== "all") {
    conditions.push(
      eq(
        appointment.status,
        status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
      )
    );
  }

  if (date) {
    conditions.push(eq(appointment.appointmentDate, date));
  }

  return db
    .select({
      appointment: appointment,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
      patientImage: user.image,
    })
    .from(appointment)
    .innerJoin(user, eq(appointment.patientId, user.id))
    .where(and(...conditions))
    .orderBy(appointment.appointmentDate, appointment.startTime);
}

/**
 * Get a single appointment with full details
 */
export async function getAppointmentById(appointmentId: string) {
  const results = await db
    .select({
      appointment: appointment,
      patientName: user.name,
      patientEmail: user.email,
      patientImage: user.image,
    })
    .from(appointment)
    .innerJoin(user, eq(appointment.patientId, user.id))
    .where(eq(appointment.id, appointmentId))
    .limit(1);

  return results[0] || null;
}

/**
 * Get all appointments (admin)
 */
export async function getAllAppointments(params: {
  page: number;
  limit: number;
  status?: string;
}) {
  const { page, limit, status } = params;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(
      eq(
        appointment.status,
        status as "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show"
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(appointment)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(appointment.createdAt)),
    db.select({ count: count() }).from(appointment).where(whereClause),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
  };
}
