import { requireAuth, apiSuccess, apiError } from "@/lib/server-utils";
import { markNotificationAsRead } from "@/services/notification.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const updated = await markNotificationAsRead(id, session.user.id);
    if (!updated) {
      return apiError("Notification not found", 404);
    }

    return apiSuccess(updated);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
