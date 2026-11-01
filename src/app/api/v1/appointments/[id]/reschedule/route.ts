import { requireAuth, apiSuccess, apiError } from "@/lib/server-utils";
import {
  getAppointmentById,
  rescheduleAppointment,
} from "@/services/appointment.service";
import { rescheduleAppointmentSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const role = (session.user as unknown as { role: string }).role;

    if (role !== "patient") {
      return apiError(
        "Forbidden: only patients can reschedule appointments",
        403
      );
    }

    const appointmentRecord = await getAppointmentById(id);
    if (!appointmentRecord) {
      return apiError("Appointment not found", 404);
    }

    if (appointmentRecord.appointment.patientId !== session.user.id) {
      return apiError("Forbidden: insufficient permissions", 403);
    }

    const body = await req.json();
    const parsed = rescheduleAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message || "Invalid input",
        400
      );
    }

    try {
      const rescheduled = await rescheduleAppointment(
        id,
        session.user.id,
        parsed.data
      );
      return apiSuccess(rescheduled);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to reschedule appointment";
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
