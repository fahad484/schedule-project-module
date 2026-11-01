import { requireAuth, apiSuccess, withErrorHandler } from "@/lib/server-utils";
import { markAllNotificationsAsRead } from "@/services/notification.service";

export const POST = withErrorHandler(async () => {
  const session = await requireAuth();
  await markAllNotificationsAsRead(session.user.id);
  return apiSuccess({ success: true });
});
