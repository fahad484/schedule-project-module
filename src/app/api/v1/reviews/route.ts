import { requireAuth, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import { createReview } from "@/services/review.service";
import { getAppointmentById } from "@/services/appointment.service";
import { reviewSchema } from "@/lib/validations";

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireAuth();
  const role = (session.user as unknown as { role: string }).role;

  if (role !== "patient") {
    return apiError("Forbidden: only patients can write reviews", 403);
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const appointmentRecord = await getAppointmentById(parsed.data.appointmentId);
  if (!appointmentRecord) {
    return apiError("Appointment not found", 404);
  }

  if (appointmentRecord.appointment.patientId !== session.user.id) {
    return apiError(
      "Forbidden: you can only review your own appointments",
      403
    );
  }

  if (appointmentRecord.appointment.status !== "completed") {
    return apiError("Can only review completed appointments", 400);
  }

  try {
    const review = await createReview({
      appointmentId: parsed.data.appointmentId,
      patientId: session.user.id,
      doctorId: appointmentRecord.appointment.doctorId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return apiSuccess(review, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create review";
    return apiError(msg, 400);
  }
});
