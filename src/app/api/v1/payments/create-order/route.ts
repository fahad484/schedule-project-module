// import { requireAuth, apiSuccess, apiError, withErrorHandler } from "@/lib/server-utils";
// import { db } from "@/lib/db";
// import { appointment, doctorProfile, payment } from "@/db/schema";
// import { bookAppointmentSchema } from "@/lib/validations";
// import { getAvailableSlots } from "@/services/appointment.service";
// import { razorpay, RAZORPAY_KEY_ID } from "@/lib/razorpay";
// import { eq, and, ne } from "drizzle-orm";

// export const POST = withErrorHandler(async (req: Request) => {
//   const session = await requireAuth();
//   const role = (session.user as unknown as { role: string }).role;

//   if (role !== "patient") {
//     return apiError("Only patients can book appointments", 403);
//   }

//   const body = await req.json();
//   const parsed = bookAppointmentSchema.safeParse(body);

//   if (!parsed.success) {
//     return apiError(parsed.error.issues[0]?.message || "Invalid input", 400);
//   }

//   const data = parsed.data;
//   const patientId = session.user.id;

//   // Fetch doctor and consultation fee from DB
//   const [doctor] = await db
//     .select()
//     .from(doctorProfile)
//     .where(eq(doctorProfile.id, data.doctorId))
//     .limit(1);

//   if (!doctor) {
//     return apiError("Doctor not found", 404);
//   }

//   if (!doctor.isAcceptingPatients) {
//     return apiError("Doctor is not accepting patients", 400);
//   }

//   // Validate that selected slot is available
//   const slots = await getAvailableSlots(data.doctorId, data.appointmentDate);

//   const selectedSlot = slots.find(
//     (slot) =>
//       slot.start.slice(0, 5) === data.startTime &&
//       slot.end.slice(0, 5) === data.endTime &&
//       slot.isAvailable
//   );

//   if (!selectedSlot) {
//     return apiError("This appointment slot is unavailable", 409);
//   }

//   // Prevent patient from booking overlapping appointment at same start time
//   const [patientConflict] = await db
//     .select()
//     .from(appointment)
//     .where(
//       and(
//         eq(appointment.patientId, patientId),
//         eq(appointment.appointmentDate, data.appointmentDate),
//         eq(appointment.startTime, data.startTime),
//         ne(appointment.status, "cancelled")
//       )
//     )
//     .limit(1);

//   if (patientConflict) {
//     return apiError("You already have an appointment at this time", 409);
//   }

//   // DB fee is in rupees; Razorpay expects integer paise
//   const amountInRupees = Number(doctor.consultationFee);
//   const amountInPaise = Math.round(amountInRupees * 100);

//   if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
//     return apiError("Invalid consultation fee", 400);
//   }

//   const appointmentId = crypto.randomUUID();

//   // Create Razorpay order
//   const order = await razorpay.orders.create({
//     amount: amountInPaise,
//     currency: "INR",
//     receipt: appointmentId,
//     notes: {
//       appointmentId,
//       patientId,
//       doctorId: data.doctorId,
//     },
//   });

//   try {
//     // Create appointment and payment together
//     await db.transaction(async (tx) => {
//       await tx.insert(appointment).values({
//         id: appointmentId,
//         patientId,
//         doctorId: data.doctorId,
//         appointmentDate: data.appointmentDate,
//         startTime: data.startTime,
//         endTime: data.endTime,
//         reason: data.reason,
//         status: "pending_payment",
//       });

//       await tx.insert(payment).values({
//         appointmentId,
//         razorpayOrderId: order.id,
//         amount: doctor.consultationFee,
//         status: "pending",
//       });
//     });
//   } catch (error) {
//     console.error("Failed to save pending appointment/payment:", error);

//     return apiError(
//       "Unable to reserve this appointment. Please try another slot.",
//       409
//     );
//   }

//   return apiSuccess(
//     {
//       appointmentId,
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       keyId: RAZORPAY_KEY_ID,
//     },
//     201
//   );
// });

// import { NextResponse } from "next/server";
// import { eq } from "drizzle-orm";

// import { db } from "@/lib/db";
// import { appointment, doctorProfile, payment } from "@/db/schema";
// import { requireAuth, requireRole } from "@/lib/server-utils";
// import { bookAppointmentSchema } from "@/lib/validations";
// import { razorpay, RAZORPAY_KEY_ID } from "@/lib/razorpay";

// export async function POST(request: Request) {
//   try {
//     const auth = await requireAuth();

//     // Adapt this if your requireAuth helper returns the user differently.
//     const user = auth.user;

//     requireRole(user, ["patient"]);

//     const body = await request.json();
//     const parsed = bookAppointmentSchema.safeParse(body);

//     if (!parsed.success) {
//       return NextResponse.json(
//         { success: false, message: "Invalid booking details", errors: parsed.error.flatten() },
//         { status: 400 }
//       );
//     }

//     const {
//       doctorId,
//       appointmentDate,
//       startTime,
//       endTime,
//       reason,
//     } = parsed.data;

//     const [doctor] = await db
//       .select()
//       .from(doctorProfile)
//       .where(eq(doctorProfile.id, doctorId))
//       .limit(1);

//     if (!doctor || !doctor.isAcceptingPatients) {
//       return NextResponse.json(
//         { success: false, message: "Doctor is unavailable" },
//         { status: 404 }
//       );
//     }

//     const amountInRupees = Number(doctor.consultationFee);

//     if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
//       return NextResponse.json(
//         { success: false, message: "Invalid consultation fee" },
//         { status: 400 }
//       );
//     }

//     // Razorpay requires paise. Database consultation fee is stored in rupees.
//     const amountInPaise = Math.round(amountInRupees * 100);

//     // Create the Razorpay order.
//     const razorpayOrder = await razorpay.orders.create({
//       amount: amountInPaise,
//       currency: "INR",
//       receipt: `appt_${Date.now()}`,
//       notes: {
//         doctorId,
//         patientId: user.id,
//         appointmentDate,
//       },
//     });

//     // Insert appointment and payment together.
//     const result = await db.transaction(async (tx) => {
//       const [newAppointment] = await tx
//         .insert(appointment)
//         .values({
//           patientId: user.id,
//           doctorId,
//           appointmentDate,
//           startTime,
//           endTime,
//           reason,
//           status: "pending_payment",
//         })
//         .returning();

//       const [newPayment] = await tx
//         .insert(payment)
//         .values({
//           appointmentId: newAppointment.id,
//           razorpayOrderId: razorpayOrder.id,
//           amount: amountInRupees.toFixed(2),
//           status: "pending",
//         })
//         .returning();

//       return {
//         appointment: newAppointment,
//         payment: newPayment,
//       };
//     });

//     return NextResponse.json({
//       success: true,
//       appointmentId: result.appointment.id,
//       orderId: razorpayOrder.id,
//       amount: amountInPaise,
//       currency: "INR",
//       keyId: RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     console.error("Create payment order error:", error);

//     return NextResponse.json(
//       { success: false, message: "Unable to create payment order" },
//       { status: 500 }
//     );
//   }
// }

import {
  requireAuth,
  apiSuccess,
  apiError,
  withErrorHandler,
} from "@/lib/server-utils";

import { db } from "@/lib/db";
import { appointment, doctorProfile, payment } from "@/db/schema";
import { bookAppointmentSchema } from "@/lib/validations";
import { getAvailableSlots } from "@/services/appointment.service";
import { razorpay, RAZORPAY_KEY_ID } from "@/lib/razorpay";

import { eq, and, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const POST = withErrorHandler(async (req: Request) => {
  // 1. Authenticate user
  const session = await requireAuth();

  const role = (session.user as unknown as { role: string }).role;

  // 2. Only patients can book appointments
  if (role !== "patient") {
    return apiError("Only patients can book appointments", 403);
  }

  // 3. Validate request body
  const body = await req.json();

  const parsed = bookAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message || "Invalid booking details",
      400
    );
  }

  const data = parsed.data;
  const patientId = session.user.id;

  // 4. Find doctor
  const [doctor] = await db
    .select()
    .from(doctorProfile)
    .where(eq(doctorProfile.id, data.doctorId))
    .limit(1);

  if (!doctor) {
    return apiError("Doctor not found", 404);
  }

  if (!doctor.isAcceptingPatients) {
    return apiError("Doctor is not accepting patients", 400);
  }

  // 5. Verify requested slot is actually available
  const slots = await getAvailableSlots(
    data.doctorId,
    data.appointmentDate
  );

  const selectedSlot = slots.find(
    (slot) =>
      slot.start.slice(0, 5) === data.startTime &&
      slot.end.slice(0, 5) === data.endTime &&
      slot.isAvailable
  );

  if (!selectedSlot) {
    return apiError("This appointment slot is unavailable", 409);
  }

  // 6. Check if patient already has an appointment at this time
  const [patientConflict] = await db
    .select()
    .from(appointment)
    .where(
      and(
        eq(appointment.patientId, patientId),
        eq(appointment.appointmentDate, data.appointmentDate),
        eq(appointment.startTime, data.startTime),
        ne(appointment.status, "cancelled")
      )
    )
    .limit(1);

  if (patientConflict) {
    return apiError(
      "You already have an appointment at this time",
      409
    );
  }

  // 7. Get consultation fee
  // DB stores fee in rupees; Razorpay requires paise
  const amountInRupees = Number(doctor.consultationFee);

  if (
    !Number.isFinite(amountInRupees) ||
    amountInRupees <= 0
  ) {
    return apiError("Invalid consultation fee", 400);
  }

  const amountInPaise = Math.round(amountInRupees * 100);

  // 8. Generate appointment ID
  const appointmentId = randomUUID();

  // 9. Create Razorpay order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: appointmentId,
    notes: {
      appointmentId,
      patientId,
      doctorId: data.doctorId,
      appointmentDate: data.appointmentDate,
    },
  });

  // 10. Save appointment and payment in one DB transaction
  try {
    await db.transaction(async (tx) => {
      await tx.insert(appointment).values({
        id: appointmentId,
        patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        status: "pending_payment",
      });

      await tx.insert(payment).values({
        appointmentId,
        razorpayOrderId: order.id,
        amount: amountInRupees.toFixed(2),
        status: "pending",
      });
    });
  } catch (error) {
    console.error(
      "Failed to save pending appointment/payment:",
      error
    );

    return apiError(
      "Unable to reserve this appointment. Please try another slot.",
      409
    );
  }

  // 11. Return order information to frontend
  return apiSuccess(
    {
      appointmentId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    },
    201
  );
});