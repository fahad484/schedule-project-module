"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  XCircle,
  CalendarCheck2,
  Loader2,
  CalendarDays,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types";

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = React.useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("all");

  // Cancel dialog state
  const [cancelModalOpen, setCancelModalOpen] = React.useState(false);
  const [cancelingAppointment, setCancelingAppointment] = React.useState<AppointmentWithDetails | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  // Reschedule dialog state
  const [rescheduleModalOpen, setRescheduleModalOpen] = React.useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = React.useState<AppointmentWithDetails | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");

  // Review dialog state
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [reviewAppointment, setReviewAppointment] = React.useState<AppointmentWithDetails | null>(null);
  const [reviewRating, setReviewRating] = React.useState<number>(5);
  const [reviewComment, setReviewComment] = React.useState<string>("");
  const [reviewLoading, setReviewLoading] = React.useState(false);

  const userRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  // const fetchAppointments = React.useCallback(async () => {
  //   try {
  //     const res = await fetch("/api/v1/appointments");
  //     if (res.ok) {
  //       const json = await res.json();
  //       if (json.data) {
  //         const list = Array.isArray(json.data) ? json.data : json.data.items || [];
  //         setAppointments(list);
  //         return;
  //       }
  //     }
  //     setAppointments([]);
  //   } catch (err) {
  //     console.error("Error fetching appointments:", err);
  //     setAppointments([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // React.useEffect(() => {
  //   let ignore = false;
  //   const load = async () => {
  //     try {
  //       const res = await fetch("/api/v1/appointments");
  //       if (res.ok) {
  //         const json = await res.json();
  //         if (!ignore && json.data) {
  //           const list = Array.isArray(json.data) ? json.data : json.data.items || [];
  //           setAppointments(list);
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Error loading appointments:", err);
  //     } finally {
  //       if (!ignore) setLoading(false);
  //     }
  //   };
  //   load();
  //   return () => {
  //     ignore = true;
  //   };
  // }, []);

const fetchAppointments = React.useCallback(async () => {
  try {
    const res = await fetch("/api/v1/appointments", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch appointments: ${res.status}`);
    }

    const json = await res.json();

    const rawList = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json.data?.items)
        ? json.data.items
        : [];

    // Flatten the API response to match the component's expected structure.
    const list = rawList.map((item: any) => {
      const appointment = item.appointment ?? item;

      return {
        ...appointment,
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        reason: appointment.reason,
        cancellationReason: appointment.cancellationReason,

        doctor: {
          user: {
            name: item.doctorName ?? "Doctor",
            email: item.doctorEmail ?? "",
          },
          specialty: {
            name: item.specialtyName ?? "",
          },
          hospitalAffiliation: item.hospitalAffiliation ?? "Clinic Visit",
        },

        patient: item.patient ?? {
          name: item.patientName ?? "Patient",
          email: item.patientEmail ?? "",
          phone: item.patientPhone ?? "",
        },
      };
    });

    setAppointments(list);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    toast.error("Unable to load appointments.");
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}, []);

// React.useEffect(() => {
//   const timer = window.setTimeout(() => {
//     void fetchAppointments();
//   }, 0);

//   return () => {
//     window.clearTimeout(timer);
//   };
// }, [fetchAppointments]);

  React.useEffect(() => {
  let ignore = false;

  async function loadAppointments() {
    try {
      const res = await fetch("/api/v1/appointments", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch appointments: ${res.status}`);
      }

      const json = await res.json();

      const rawList = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.items)
          ? json.data.items
          : [];

      const list = rawList.map((item: any) => {
        const appointment = item.appointment ?? item;

        return {
          ...appointment,
          doctor: {
            user: {
              name: item.doctorName ?? "Doctor",
              email: item.doctorEmail ?? "",
            },
            specialty: {
              name: item.specialtyName ?? "",
            },
            hospitalAffiliation:
              item.hospitalAffiliation ?? "Clinic Visit",
          },
          patient: item.patient ?? {
            name: item.patientName ?? "Patient",
            email: item.patientEmail ?? "",
            phone: item.patientPhone ?? "",
          },
        };
      });

      if (!ignore) {
        setAppointments(list);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);

      if (!ignore) {
        toast.error("Unable to load appointments.");
        setAppointments([]);
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }

  void loadAppointments();

  return () => {
    ignore = true;
  };
}, []);

  // Filter appointments
  const filteredAppointments = React.useMemo(() => {
    if (activeTab === "all") return appointments;
    if (activeTab === "upcoming") {
      return appointments.filter(
        (a) => a.status === "scheduled" || a.status === "confirmed"
      );
    }
    if (activeTab === "completed") {
      return appointments.filter((a) => a.status === "completed");
    }
    if (activeTab === "cancelled") {
      return appointments.filter(
        (a) => a.status === "cancelled" || a.status === "no_show"
      );
    }
    return appointments;
  }, [appointments, activeTab]);

  const handleOpenCancel = (app: AppointmentWithDetails) => {
    setCancelingAppointment(app);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelingAppointment) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error("Please provide a reason for cancellation (at least 5 chars)");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/appointments/${cancelingAppointment.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to cancel appointment");
      }

      toast.success("Appointment successfully cancelled");
      setCancelModalOpen(false);
      fetchAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel appointment";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReschedule = (app: AppointmentWithDetails) => {
    setReschedulingAppointment(app);
    setRescheduleDate(app.appointmentDate);
    setRescheduleTime(app.startTime);
    setRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingAppointment) return;
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please select a valid date and start time");
      return;
    }

    setActionLoading(true);
    try {
      // End time assumed 30 mins after start time
      const [h, m] = rescheduleTime.split(":").map(Number);
      const endMins = h * 60 + m + 30;
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      const res = await fetch(`/api/v1/appointments/${reschedulingAppointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: rescheduleDate,
          startTime: rescheduleTime,
          endTime,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to reschedule appointment");
      }

      toast.success("Appointment rescheduled successfully");
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reschedule appointment";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReview = (app: AppointmentWithDetails) => {
    setReviewAppointment(app);
    setReviewRating(5);
    setReviewComment("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewAppointment) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: reviewAppointment.id,
          rating: Number(reviewRating),
          comment: reviewComment.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit review");
      }

      toast.success("Thank you! Your verified review has been submitted.");
      setReviewModalOpen(false);
      fetchAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review";
      toast.error(msg);
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700">Confirmed</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-emerald-600 text-emerald-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no_show":
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Appointments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your upcoming consultations and medical appointment history.
          </p>
        </div>

        <Button asChild>
          <Link href="/doctors">
            <CalendarDays className="mr-2 h-4 w-4" />
            Book New Appointment
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredAppointments.map((app, index) => {
                const partnerName =
                  userRole === "doctor"
                    ? app.patient?.name || "Patient"
                    : app.doctor?.user?.name || "Doctor";
                const specialtyName = app.doctor?.specialty?.name;
                const isUpcoming =
                  app.status === "scheduled" || app.status === "confirmed";

                return (
                  <Card key={app.id ?? `appointment-${index}`} className="border-border/80 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(partnerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold">
                              {partnerName}
                            </CardTitle>
                            {specialtyName && (
                              <Badge variant="outline" className="text-xs">
                                {specialtyName}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {userRole === "doctor"
                              ? `Patient Contact: ${app.patient?.phone || app.patient?.email}`
                              : app.doctor?.hospitalAffiliation || "Clinic Visit"}
                          </p>
                        </div>
                      </div>

                      <div>{getStatusBadge(app.status)}</div>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-foreground">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          <span>{formatDate(app.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {formatTime(app.startTime)} - {formatTime(app.endTime)}
                          </span>
                        </div>
                      </div>

                      {app.reason && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">Reason: </span>
                          <span>{app.reason}</span>
                        </div>
                      )}

                      {app.cancellationReason && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                          <span className="font-semibold">Cancellation reason: </span>
                          <span>{app.cancellationReason}</span>
                        </div>
                      )}
                    </CardContent>

                    {isUpcoming && (
                      <CardFooter className="flex flex-wrap gap-2 justify-end border-t border-border/60 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReschedule(app)}
                        >
                          <CalendarCheck2 className="mr-1.5 h-3.5 w-3.5" />
                          Reschedule
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleOpenCancel(app)}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Cancel Visit
                        </Button>
                      </CardFooter>
                    )}

                    {app.status === "completed" && userRole === "patient" && (
                      <CardFooter className="flex flex-wrap gap-2 justify-end border-t border-border/60 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                          onClick={() => handleOpenReview(app)}
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          Leave a Review
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3 text-muted-foreground">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">No appointments found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                There are no {activeTab === "all" ? "" : activeTab} appointments recorded in your account.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/doctors">Find Doctors & Book</Link>
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this consultation? Please provide a brief reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for cancellation</Label>
              <Textarea
                id="cancelReason"
                placeholder="Reason (e.g., schedule conflict, feeling better)..."
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              disabled={actionLoading}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={actionLoading || cancelReason.trim().length < 5}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for your consultation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rescheduleDate">New Date</Label>
              <Input
                id="rescheduleDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rescheduleTime">Start Time</Label>
              <Input
                id="rescheduleTime"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRescheduleModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReschedule}
              disabled={actionLoading || !rescheduleDate || !rescheduleTime}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your consultation experience with{" "}
              {reviewAppointment?.doctor?.user?.name || "your doctor"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= reviewRating
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-semibold ml-2">
                  {reviewRating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewComment">Review Comment (Optional)</Label>
              <Textarea
                id="reviewComment"
                placeholder="Describe the doctor's communication, treatment clarity, and overall experience..."
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReviewModalOpen(false)}
              disabled={reviewLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewLoading}
              className="gap-2"
            >
              {reviewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
