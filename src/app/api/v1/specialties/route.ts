import { requireRole, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import { getAllSpecialties, createSpecialty } from "@/services/specialty.service";
import { specialtySchema } from "@/lib/validations";

export const GET = withErrorHandler(async () => {
  const specialties = await getAllSpecialties();
  return apiSuccess(specialties);
});

export const POST = withErrorHandler(async (req: Request) => {
  await requireRole("admin");
  const body = await req.json();
  const parsed = specialtySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const created = await createSpecialty(parsed.data);
  return apiSuccess(created, 201);
});
