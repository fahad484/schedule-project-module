import { requireRole, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import {
  getDoctorProfile,
  getDoctorAvailability,
  setDoctorAvailability,
  removeDoctorAvailability,
} from "@/services/doctor.service";
import { availabilitySchema } from "@/lib/validations";

export const GET = withErrorHandler(async () => {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    return apiError("Doctor profile not found. Please create your profile first.", 404);
  }

  const availability = await getDoctorAvailability(profile.id);
  return apiSuccess(availability);
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    return apiError("Doctor profile not found", 404);
  }

  const body = await req.json();
  const parsed = availabilitySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const created = await setDoctorAvailability(profile.id, parsed.data);
  return apiSuccess(created, 201);
});

export const DELETE = withErrorHandler(async (req: Request) => {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    return apiError("Doctor profile not found", 404);
  }

  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");
  if (!id) {
    try {
      const body = await req.json();
      id = body.id;
    } catch {
      // Body parsing failed or empty
    }
  }

  if (!id) {
    return apiError("Availability ID is required", 400);
  }

  const removed = await removeDoctorAvailability(id, profile.id);
  if (!removed) {
    return apiError("Availability not found", 404);
  }

  return apiSuccess({ deleted: true });
});
