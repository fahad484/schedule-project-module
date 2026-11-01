import { requireRole, apiSuccess, apiError } from "@/lib/server-utils";
import {
  getAppointmentById,
  completeAppointment,
} from "@/services/appointment.service";
import { getDoctorProfile } from "@/services/doctor.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole("doctor");

    const appointmentRecord = await getAppointmentById(id);
    if (!appointmentRecord) {
      return apiError("Appointment not found", 404);
    }

    const profile = await getDoctorProfile(session.user.id);
    if (!profile || profile.id !== appointmentRecord.appointment.doctorId) {
      return apiError("Forbidden: insufficient permissions", 403);
    }

    let notes: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.notes === "string") {
        notes = body.notes;
      }
    } catch {
      // Body is optional
    }

    try {
      const completed = await completeAppointment(id, notes);
      return apiSuccess(completed);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to complete appointment";
      return apiError(msg, 400);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
