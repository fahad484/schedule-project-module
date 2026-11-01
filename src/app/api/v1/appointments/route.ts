import { requireAuth, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import {
  getPatientAppointments,
  getDoctorAppointments,
  bookAppointment,
} from "@/services/appointment.service";
import { getDoctorProfile } from "@/services/doctor.service";
import { bookAppointmentSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireAuth();
  const role = (session.user as unknown as { role: string }).role;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  if (role === "doctor") {
    const profile = await getDoctorProfile(session.user.id);
    if (!profile) {
      return apiError("Doctor profile not found", 404);
    }
    const date = searchParams.get("date") || undefined;
    const appointments = await getDoctorAppointments(profile.id, status, date);
    return apiSuccess(appointments);
  }

  const appointments = await getPatientAppointments(session.user.id, status);
  return apiSuccess(appointments);
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireAuth();
  const role = (session.user as unknown as { role: string }).role;

  if (role !== "patient") {
    return apiError("Forbidden: only patients can book appointments", 403);
  }

  const body = await req.json();
  const parsed = bookAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  try {
    const booked = await bookAppointment({
      patientId: session.user.id,
      ...parsed.data,
    });
    return apiSuccess(booked, 201);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to book appointment";
    return apiError(message, 400);
  }
});
