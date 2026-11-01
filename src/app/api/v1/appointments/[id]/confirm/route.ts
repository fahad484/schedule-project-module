import { requireRole, apiSuccess, apiError } from "@/lib/server-utils";
import {
  getAppointmentById,
  confirmAppointment,
} from "@/services/appointment.service";
import { getDoctorProfile } from "@/services/doctor.service";

export async function POST(
  _req: Request,
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

    try {
      const confirmed = await confirmAppointment(id);
      return apiSuccess(confirmed);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to confirm appointment";
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
