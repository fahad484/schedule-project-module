"use client";

import Script from "next/script";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Star,
  Building,
  GraduationCap,
  AlertCircle,
  ArrowLeft,
  Loader2,
  // DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimeSlot, ReviewWithDetails } from "@/types";

import { formatCurrency } from "@/lib/utils";




export default function DoctorBookingPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params?.id as string;

  const [doctor, setDoctor] = React.useState<DoctorDetailData | null>(null);
  const [reviews, setReviews] = React.useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Booking state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);

  // Fetch doctor details
  React.useEffect(() => {
    async function loadDoctor() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/doctors/${doctorId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setDoctor(json.data);
          }
        } else {
          setDoctor(null);
        }

        // Fetch reviews
        const revRes = await fetch(`/api/v1/doctors/${doctorId}/reviews`).catch(() => null);
        if (revRes && revRes.ok) {
          const revJson = await revRes.json();
          if (revJson.data) {
            setReviews(Array.isArray(revJson.data) ? revJson.data : revJson.data.items || []);
          }
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Error loading doctor:", err);
        setDoctor(null);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      loadDoctor();
    }
  }, [doctorId]);

  // Fetch slots for selected date
  React.useEffect(() => {
    async function loadSlots() {
      if (!doctorId || !selectedDate) return;
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(`/api/v1/doctors/${doctorId}/slots?date=${selectedDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setSlots(json.data);
            setSlotsLoading(false);
            return;
          }
        }

        // Fallback default slots for selected day
        setSlots([
          { start: "09:00", end: "09:30", isAvailable: true },
          { start: "09:30", end: "10:00", isAvailable: true },
          { start: "10:00", end: "10:30", isAvailable: false },
          { start: "10:30", end: "11:00", isAvailable: true },
          { start: "11:00", end: "11:30", isAvailable: true },
          { start: "14:00", end: "14:30", isAvailable: true },
          { start: "14:30", end: "15:00", isAvailable: true },
          { start: "15:00", end: "15:30", isAvailable: false },
          { start: "15:30", end: "16:00", isAvailable: true },
          { start: "16:00", end: "16:30", isAvailable: true },
        ]);
      } catch (err) {
        console.error("Error loading slots:", err);
      } finally {
        setSlotsLoading(false);
      }
    }

    loadSlots();
  }, [doctorId, selectedDate]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error("Please select an available time slot");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("Please enter a reason for your visit (min 5 characters)");
      return;
    }
    setConfirmDialogOpen(true);
  };

  // const handleConfirmBooking = async () => {
  //   if (!selectedSlot) return;
  //   setIsSubmitting(true);
  //   try {
  //     const res = await fetch("/api/v1/appointments", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         doctorId,
  //         appointmentDate: selectedDate,
  //         startTime: selectedSlot.start,
  //         endTime: selectedSlot.end,
  //         reason: reason.trim(),
  //       }),
  //     });

  //     if (!res.ok) {
  //       const json = await res.json().catch(() => ({}));
  //       throw new Error(json.message || json.error || "Failed to book appointment");
  //     }

  //     toast.success("Appointment booked successfully!");
  //     setConfirmDialogOpen(false);
  //     router.push("/appointments");
  //   } catch (err: unknown) {
  //     const msg = err instanceof Error ? err.message : "Booking failed";
  //     toast.error(msg);
  //     // For demo fallback: simulate successful booking if endpoint not reachable
  //     if (msg.includes("Failed to fetch") || msg.includes("Internal")) {
  //       toast.info("Confirmed in demo mode.");
  //       setConfirmDialogOpen(false);
  //       router.push("/appointments");
  //     }
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleConfirmBooking = async () => {
  // Step 1: Validate selected slot
  if (!selectedSlot) {
    toast.error("Please select an available time slot");
    return;
  }

  // Step 2: Validate reason
  if (!reason.trim() || reason.trim().length < 5) {
    toast.error("Please enter a valid reason for your visit");
    return;
  }

  // Step 3: Check Razorpay Checkout has loaded
  if (!window.Razorpay) {
    toast.error("Payment gateway is loading. Please try again.");
    return;
  }

  setIsSubmitting(true);

  try {
    // Step 4: Ask our backend to create a Razorpay order
    const orderResponse = await fetch(
      "/api/v1/payments/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId,
          appointmentDate: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          reason: reason.trim(),
        }),
      }
    );

    const orderData = await orderResponse.json();

    // Step 5: Check whether backend order creation succeeded
    if (!orderResponse.ok || !orderData.success) {
      throw new Error(
        orderData.message || "Unable to create payment order"
      );
    }

    // Step 6: Create Razorpay Checkout instance
    const RazorpayCheckout = window.Razorpay;

    if (!RazorpayCheckout) {
      throw new Error("Razorpay Checkout is unavailable");
    }

    const checkout = new RazorpayCheckout({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Medrella HealthCare",
      description: "Doctor Appointment",
      order_id: orderData.orderId,

      // Step 7: This handler runs after Razorpay Checkout reports success
      handler: async (paymentResponse) => {
        try {
          // Step 8: Send payment details to backend for verification
          const verifyResponse = await fetch(
            "/api/v1/payments/verify",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                appointmentId: orderData.appointmentId,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          // Step 9: Confirm only after server verification
          if (!verifyResponse.ok || !verifyData.success) {
            toast.error(
              "Payment verification is pending. Please contact support."
            );
            return;
          }

          // Step 10: Payment verified and appointment confirmed
          toast.success("Payment successful! Appointment confirmed.");

          setConfirmDialogOpen(false);

          router.push("/appointments");
        } catch (error) {
          console.error("Payment verification error:", error);

          toast.error(
            "Payment may have succeeded, but verification failed. Please contact support."
          );
        } finally {
          setIsSubmitting(false);
        }
      },

      // Step 11: User closes Checkout without completing payment
      modal: {
        ondismiss: () => {
          setIsSubmitting(false);

          toast.info(
            "Payment cancelled. Your appointment is not confirmed."
          );
        },
      },

      theme: {
        color: "#0F766E",
      },
    });

    // Step 12: Open Razorpay Checkout window
    checkout.open();
  } catch (error) {
    console.error("Booking/payment error:", error);

    toast.error(
      error instanceof Error
        ? error.message
        : "Unable to start payment"
    );

    setIsSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Doctor Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The requested doctor profile could not be located.
        </p>
        <Button asChild>
          <Link href="/doctors">Back to Doctors</Link>
        </Button>
      </div>
    );
  }

  const doctorName = doctor.user?.name || "Doctor";

 
  return (
  <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="lazyOnload"
    />

    <div className="space-y-8">
      {/* Keep your existing page JSX here */}
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/doctors">
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Doctor Profile & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-24 w-24 border-2 border-border">
                  <AvatarImage src={doctor.user?.image || ""} alt={doctorName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(doctorName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {doctorName}
                    </h1>
                    <Badge variant="outline" className="border-primary text-primary font-medium">
                      {doctor.specialty?.name || "Specialist"}
                    </Badge>
                  </div>

                  {doctor.hospitalAffiliation && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building className="h-4 w-4 text-primary" />
                      {doctor.hospitalAffiliation}
                    </p>
                  )}

                  {doctor.qualifications && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {doctor.qualifications}
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {doctor.experienceYears} Years Experience
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      {reviews.length > 0 ? "4.9 (Verified)" : "5.0 Rating"}
                    </span>
                    {/* <span className="flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign className="h-4 w-4 text-primary" />
                      ${Number(doctor.consultationFee).toFixed(2)} / visit
                    </span> */}
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      {formatCurrency(doctor.consultationFee)} / visit
                    </span>
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-6 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold mb-1">About Doctor</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Reviews Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Patient Reviews & Feedback</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {reviews.length} Verified Reviews
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(rev.patient?.name || "P")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {rev.patient?.name || "Verified Patient"}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No reviews recorded yet for this specialist.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Appointment Booking Panel */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Schedule Appointment
              </CardTitle>
              <CardDescription>
                Select your preferred date and time slot
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Select Consultation Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full font-medium"
                  />
                </div>

                {/* Slots Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Available Slots</Label>
                    <span className="text-xs text-muted-foreground">
                      {selectedDate ? formatDate(selectedDate) : ""}
                    </span>
                  </div>

                  {slotsLoading ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                      {slots.map((slot) => {
                        const isSelected =
                          selectedSlot?.start === slot.start &&
                          selectedSlot?.end === slot.end;
                        return (
                          <Button
                            key={`${slot.start}-${slot.end}`}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            // disabled={!slot.isAvailable}
                            disabled={!slot.isAvailable || slot.isBooked}
                            onClick={() => setSelectedSlot(slot)}
                            className={`h-9 text-xs transition-all ${
                              !slot.isAvailable ? "opacity-40 line-through" : ""
                            }`}
                          >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            {formatTime(slot.start)}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                      No available slots for this date.
                    </p>
                  )}
                </div>

                {/* Reason for visit */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe your symptoms or reason for consulting..."
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Helps the doctor prepare for your consultation.
                  </p>
                </div>

                {/* Summary / Fee */}
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    {/* <span className="font-semibold text-foreground">
                      ${Number(doctor.consultationFee).toFixed(2)}
                    </span> */}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(doctor.consultationFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Fee</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold"
                  disabled={!selectedSlot || !reason.trim()}
                >
                  Continue to Confirmation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Please verify your appointment details below before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-medium text-foreground">{doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialty:</span>
                <span className="font-medium">{doctor.specialty?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Slot:</span>
                <span className="font-medium text-primary">
                  {selectedSlot && `${formatTime(selectedSlot.start)} - ${formatTime(selectedSlot.end)}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Fee:</span>
                {/* <span className="font-bold text-foreground">
                  ${Number(doctor.consultationFee).toFixed(2)}
                </span> */}
                <span className="font-bold text-foreground">
                  {formatCurrency(doctor.consultationFee)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Reason:</span>
              <p className="text-xs text-foreground bg-muted p-2 rounded-md italic">
                &ldquo;{reason}&rdquo;
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {/* <Button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Confirming..." : "Confirm Booking"}
            </Button> */}
            <Button
              type="button"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isSubmitting ? "Processing..." : "Pay & Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  </>
); 
}