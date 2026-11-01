import { apiSuccess, apiError } from "@/lib/server-utils";
import { getDoctorProfileById } from "@/services/doctor.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctor = await getDoctorProfileById(id);
    if (!doctor) {
      return apiError("Doctor not found", 404);
    }
    return apiSuccess(doctor);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
