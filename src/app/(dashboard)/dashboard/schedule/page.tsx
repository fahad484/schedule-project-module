"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScheduleAppointment {
  appointment: {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: string;
    reason: string | null;
    notes: string | null;
  };
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  patientImage: string | null;
}

export default function SchedulePage() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [appointments, setAppointments] = React.useState<
    ScheduleAppointment[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Complete dialog
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [completingId, setCompletingId] = React.useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = React.useState("");

  const fetchAppointments = React.useCallback(
    async (date: string) => {
      try {
        const res = await fetch(
          `/api/v1/appointments?date=${date}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setAppointments(
              Array.isArray(json.data) ? json.data : json.data.items || []
            );
          }
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/v1/appointments?date=${selectedDate}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.data) {
            setAppointments(
              Array.isArray(json.data) ? json.data : json.data.items || []
            );
          }
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleConfirm = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch(
        `/api/v1/appointments/${appointmentId}/confirm`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Failed to confirm appointment");

      toast.success("Appointment confirmed");
      fetchAppointments(selectedDate);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch(
        `/api/v1/appointments/${appointmentId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled by doctor" }),
        }
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Failed to cancel appointment");

      toast.success("Appointment cancelled");
      fetchAppointments(selectedDate);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openCompleteDialog = (appointmentId: string) => {
    setCompletingId(appointmentId);
    setCompletionNotes("");
    setCompleteDialogOpen(true);
  };

  const handleComplete = async () => {
    if (!completingId) return;
    setActionLoading(completingId);
    try {
      const res = await fetch(
        `/api/v1/appointments/${completingId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: completionNotes.trim() || undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.error || "Failed to complete appointment"
        );

      toast.success("Appointment marked as completed");
      setCompleteDialogOpen(false);
      fetchAppointments(selectedDate);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "secondary";
      case "confirmed":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          My Appointment Schedule
        </h1>
        <p className="text-sm text-muted-foreground">
          View, confirm, complete, or cancel patient appointments by date.
        </p>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3 flex-1 justify-center">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto font-medium"
              />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {formatDate(selectedDate)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(today)}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Appointments for {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : appointments.length === 0
                ? "No appointments scheduled for this date."
                : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No appointments are scheduled for this date.
              </p>
            </div>
          )}

          {!loading &&
            appointments.map((item) => {
              const apt = item.appointment;
              const isActionable =
                apt.status === "scheduled" || apt.status === "confirmed";

              return (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border p-4"
                >
                  {/* Info */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">
                        {item.patientName}
                      </span>
                      <Badge
                        variant={statusColor(apt.status)}
                        className="text-[10px] capitalize"
                      >
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(apt.startTime)} –{" "}
                        {formatTime(apt.endTime)}
                      </span>
                      {item.patientEmail && (
                        <span>{item.patientEmail}</span>
                      )}
                      {item.patientPhone && (
                        <span>{item.patientPhone}</span>
                      )}
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                        <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {apt.reason}
                      </p>
                    )}

                    {apt.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2 mt-1">
                        <strong>Notes:</strong> {apt.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isActionable && (
                    <div className="flex items-center gap-2 shrink-0">
                      {apt.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          disabled={actionLoading === apt.id}
                          onClick={() => handleConfirm(apt.id)}
                        >
                          {actionLoading === apt.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          )}
                          Confirm
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        disabled={actionLoading === apt.id}
                        onClick={() =>
                          openCompleteDialog(apt.id)
                        }
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Complete
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-destructive hover:text-destructive"
                        disabled={actionLoading === apt.id}
                        onClick={() => handleCancel(apt.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
            <DialogDescription>
              Add optional consultation notes before marking the appointment as
              completed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Post-consultation notes (optional)..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={actionLoading !== null}
              className="gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
