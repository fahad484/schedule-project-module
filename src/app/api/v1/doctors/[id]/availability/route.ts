import { apiSuccess, apiError } from "@/lib/server-utils";
import { getDoctorAvailability, getDoctorBookedSlots } from "@/services/doctor.service";

// export async function GET(
//   _req: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const { id } = await params;
//     const availability = await getDoctorAvailability(id);
//     return apiSuccess(availability);
//   } catch (error: unknown) {
//     const message =
//       error instanceof Error ? error.message : "Internal server error";
//     if (message === "Unauthorized") return apiError(message, 401);
//     if (message.startsWith("Forbidden")) return apiError(message, 403);
//     return apiError(message, 500);
//   }
// }



export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date");

    if (!selectedDate) {
      return apiError("Date is required", 400);
    }

    const [availability, bookedSlots] = await Promise.all([
      getDoctorAvailability(id),
      getDoctorBookedSlots(id, selectedDate),
    ]);

    return apiSuccess({
      availability,
      bookedSlots,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);

    return apiError(message, 500);
  }
}
