"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/server-utils";
import { createReview } from "@/services/review.service";
import { reviewSchema } from "@/lib/validations";

export async function createReviewAction(data: {
  appointmentId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}) {
  const session = await requireAuth();
  const parsed = reviewSchema.parse({
    appointmentId: data.appointmentId,
    rating: data.rating,
    comment: data.comment,
  });

  const result = await createReview({
    appointmentId: parsed.appointmentId,
    patientId: session.user.id,
    doctorId: data.doctorId,
    rating: parsed.rating,
    comment: parsed.comment,
  });

  revalidatePath("/appointments");
  revalidatePath(`/doctors/${data.doctorId}`);
  return { success: true, data: result };
}
