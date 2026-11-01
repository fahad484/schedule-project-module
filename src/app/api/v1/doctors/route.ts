import { apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
import { searchDoctors } from "@/services/doctor.service";
import { doctorSearchSchema } from "@/lib/validations";

export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);

  const parsed = doctorSearchSchema.safeParse({
    specialtyId: searchParams.get("specialtyId") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message || "Invalid query parameters",
      400
    );
  }

  const { items, total } = await searchDoctors(parsed.data);

  return apiSuccess({
    items,
    total,
    page: parsed.data.page,
    limit: parsed.data.limit,
    totalPages: Math.ceil(total / parsed.data.limit),
  });
});
