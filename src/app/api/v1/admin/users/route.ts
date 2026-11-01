import { requireRole, apiSuccess, withErrorHandler } from "@/lib/server-utils";
import { getAllUsers } from "@/services/admin.service";

export const GET = withErrorHandler(async (req: Request) => {
  await requireRole("admin");
  const { searchParams } = new URL(req.url);

  const page = searchParams.get("page")
    ? Math.max(1, parseInt(searchParams.get("page")!, 10))
    : 1;
  const limit = searchParams.get("limit")
    ? Math.min(100, Math.max(1, parseInt(searchParams.get("limit")!, 10)))
    : 10;

  const { items, total } = await getAllUsers(page, limit);

  return apiSuccess({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});
