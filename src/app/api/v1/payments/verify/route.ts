import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { appointment, payment } from "@/db/schema";
import { requireAuth, requireRole } from "@/lib/server-utils";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    const user = auth.user;

    requireRole(user, ["patient"]);

    const body = await request.json();

    const {
      appointmentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !appointmentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification details" },
        { status: 400 }
      );
    }

    const [appointmentRecord] = await db
      .select()
      .from(appointment)
      .where(eq(appointment.id, appointmentId))
      .limit(1);

    if (!appointmentRecord || appointmentRecord.patientId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Appointment not found" },
        { status: 404 }
      );
    }

    const [paymentRecord] = await db
      .select()
      .from(payment)
      .where(eq(payment.appointmentId, appointmentId))
      .limit(1);

    if (!paymentRecord || paymentRecord.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, message: "Payment order does not match" },
        { status: 400 }
      );
    }

    // Idempotent response for a repeated verification request.
    if (
      paymentRecord.status === "paid" &&
      paymentRecord.razorpayPaymentId === razorpay_payment_id
    ) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        appointmentId,
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is missing");
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Confirm the payment status with Razorpay itself.
    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      !["captured"].includes(razorpayPayment.status)
    ) {
      return NextResponse.json(
        { success: false, message: "Payment is not captured yet" },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(payment)
        .set({
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(payment.id, paymentRecord.id));

      await tx
        .update(appointment)
        .set({
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(appointment.id, appointmentId));
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and appointment confirmed",
      appointmentId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { success: false, message: "Payment verification failed" },
      { status: 500 }
    );
  }
}