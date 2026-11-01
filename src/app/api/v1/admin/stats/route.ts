import { requireRole, apiSuccess, withErrorHandler } from "@/lib/server-utils";
import { getAdminStats } from "@/services/admin.service";

export const GET = withErrorHandler(async () => {
  await requireRole("admin");
  const stats = await getAdminStats();
  return apiSuccess(stats);
});
