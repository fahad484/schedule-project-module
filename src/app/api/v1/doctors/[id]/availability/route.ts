import { apiSuccess, apiError } from "@/lib/server-utils";
import { getDoctorAvailability } from "@/services/doctor.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const availability = await getDoctorAvailability(id);
    return apiSuccess(availability);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
