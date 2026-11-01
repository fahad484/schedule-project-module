import { requireAuth, apiSuccess, apiError } from "@/lib/server-utils";
import {
  getAppointmentById,
  cancelAppointment,
} from "@/services/appointment.service";
import { getDoctorProfile } from "@/services/doctor.service";
import { cancelAppointmentSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const role = (session.user as unknown as { role: string }).role;

    const appointmentRecord = await getAppointmentById(id);
    if (!appointmentRecord) {
      return apiError("Appointment not found", 404);
    }

    if (
      role !== "admin" &&
      appointmentRecord.appointment.patientId !== session.user.id
    ) {
      const profile = await getDoctorProfile(session.user.id);
      if (!profile || profile.id !== appointmentRecord.appointment.doctorId) {
        return apiError("Forbidden: insufficient permissions", 403);
      }
    }

    const body = await req.json();
    const parsed = cancelAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message || "Invalid cancellation reason",
        400
      );
    }

    try {
      const cancelled = await cancelAppointment(
        id,
        session.user.id,
        parsed.data.reason
      );
      return apiSuccess(cancelled);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to cancel appointment";
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
