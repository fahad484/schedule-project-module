"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/server-utils";
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  confirmAppointment,
  completeAppointment,
} from "@/services/appointment.service";
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/lib/validations";

export async function bookAppointmentAction(data: {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const session = await requireAuth();
  const parsed = bookAppointmentSchema.parse(data);

  const result = await bookAppointment({
    patientId: session.user.id,
    ...parsed,
  });

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function cancelAppointmentAction(data: {
  appointmentId: string;
  reason: string;
}) {
  const session = await requireAuth();
  const parsed = cancelAppointmentSchema.parse({ reason: data.reason });

  const result = await cancelAppointment(
    data.appointmentId,
    session.user.id,
    parsed.reason
  );

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function rescheduleAppointmentAction(data: {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}) {
  const session = await requireAuth();
  const parsed = rescheduleAppointmentSchema.parse({
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    endTime: data.endTime,
  });

  const result = await rescheduleAppointment(
    data.appointmentId,
    session.user.id,
    parsed
  );

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function confirmAppointmentAction(appointmentId: string) {
  await requireRole("doctor");
  const result = await confirmAppointment(appointmentId);

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function completeAppointmentAction(
  appointmentId: string,
  notes?: string
) {
  await requireRole("doctor");
  const result = await completeAppointment(appointmentId, notes);

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: result };
}
