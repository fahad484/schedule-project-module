import { requireRole, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import {
  getDoctorProfile,
  createDoctorProfile,
  updateDoctorProfile,
} from "@/services/doctor.service";
import { doctorProfileSchema } from "@/lib/validations";

export const GET = withErrorHandler(async () => {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    return apiError("Doctor profile not found", 404);
  }
  return apiSuccess(profile);
});

export const POST = withErrorHandler(async (req: Request) => {
  const session = await requireRole("doctor");
  const existing = await getDoctorProfile(session.user.id);
  if (existing) {
    return apiError("Doctor profile already exists", 400);
  }

  const body = await req.json();
  const parsed = doctorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const created = await createDoctorProfile({
    userId: session.user.id,
    ...parsed.data,
  });

  return apiSuccess(created, 201);
});

export const PUT = withErrorHandler(async (req: Request) => {
  const session = await requireRole("doctor");
  const existing = await getDoctorProfile(session.user.id);
  if (!existing) {
    return apiError("Doctor profile not found", 404);
  }

  const body = await req.json();
  const parsed = doctorProfileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const updated = await updateDoctorProfile(existing.id, parsed.data);
  return apiSuccess(updated);
});
