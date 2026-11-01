import { db } from "@/lib/db";
import { review, appointment, user } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { updateDoctorRating } from "./doctor.service";

export async function createReview(data: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}) {
  // Verify appointment exists, belongs to patient, and is completed
  const apt = await db
    .select()
    .from(appointment)
    .where(
      and(
        eq(appointment.id, data.appointmentId),
        eq(appointment.patientId, data.patientId)
      )
    )
    .limit(1);

  if (!apt[0]) {
    throw new Error("Appointment not found");
  }

  if (apt[0].status !== "completed") {
    throw new Error("Can only review completed appointments");
  }

  if (apt[0].doctorId !== data.doctorId) {
    throw new Error("Doctor ID does not match the appointment");
  }

  // Check if already reviewed
  const existingReview = await db
    .select()
    .from(review)
    .where(eq(review.appointmentId, data.appointmentId))
    .limit(1);

  if (existingReview.length > 0) {
    throw new Error("This appointment has already been reviewed");
  }

  const results = await db
    .insert(review)
    .values({
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      rating: data.rating,
      comment: data.comment,
    })
    .returning();

  // Update doctor's average rating
  await updateDoctorRating(data.doctorId);

  return results[0];
}

export async function getDoctorReviews(
  doctorId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit;

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: review.id,
        appointmentId: review.appointmentId,
        patientId: review.patientId,
        doctorId: review.doctorId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        patient: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(review)
      .innerJoin(user, eq(review.patientId, user.id))
      .where(eq(review.doctorId, doctorId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(review.createdAt)),
    db
      .select({ count: count() })
      .from(review)
      .where(eq(review.doctorId, doctorId)),
  ]);

  return {
    items,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function getReviewById(reviewId: string) {
  const results = await db
    .select()
    .from(review)
    .where(eq(review.id, reviewId))
    .limit(1);
  return results[0] || null;
}
