import { apiSuccess, apiError } from "@/lib/server-utils";
import { getDoctorReviews } from "@/services/review.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page")
      ? Math.max(1, parseInt(searchParams.get("page")!, 10))
      : 1;
    const limit = searchParams.get("limit")
      ? Math.min(100, Math.max(1, parseInt(searchParams.get("limit")!, 10)))
      : 10;

    const { items, total } = await getDoctorReviews(id, page, limit);

    return apiSuccess({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
