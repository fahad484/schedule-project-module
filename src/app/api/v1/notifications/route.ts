import { requireAuth, apiSuccess, withErrorHandler } from "@/lib/server-utils";
import { getUserNotifications } from "@/services/notification.service";

export const GET = withErrorHandler(async (req: Request) => {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);

  const page = searchParams.get("page")
    ? Math.max(1, parseInt(searchParams.get("page")!, 10))
    : 1;
  const limit = searchParams.get("limit")
    ? Math.min(100, Math.max(1, parseInt(searchParams.get("limit")!, 10)))
    : 20;

  const result = await getUserNotifications(session.user.id, page, limit);

  return apiSuccess({
    items: result.items,
    total: result.total,
    unread: result.unread,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  });
});
