import { requireRole, apiSuccess, apiError } from "@/lib/server-utils";
import { updateUserRole } from "@/services/admin.service";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["patient", "doctor", "admin"], {
    message: "Role must be 'patient', 'doctor', or 'admin'",
  }),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = await req.json();
    const parsed = roleSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message || "Invalid role",
        400
      );
    }

    const updatedUser = await updateUserRole(id, parsed.data.role);
    if (!updatedUser) {
      return apiError("User not found", 404);
    }

    return apiSuccess(updatedUser);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
