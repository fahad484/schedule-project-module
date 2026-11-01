import { requireRole, apiSuccess, apiError } from "@/lib/server-utils";
import {
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty,
} from "@/services/specialty.service";
import { specialtySchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getSpecialtyById(id);
    if (!item) {
      return apiError("Specialty not found", 404);
    }
    return apiSuccess(item);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const body = await req.json();
    const parsed = specialtySchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
    }

    const updated = await updateSpecialty(id, parsed.data);
    if (!updated) {
      return apiError("Specialty not found", 404);
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const deleted = await deleteSpecialty(id);
    if (!deleted) {
      return apiError("Specialty not found", 404);
    }
    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") return apiError(message, 401);
    if (message.startsWith("Forbidden")) return apiError(message, 403);
    return apiError(message, 500);
  }
}
