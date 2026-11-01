"use client";

import * as React from "react";
import {
  Clock,
  Plus,
  Trash2,
  Loader2,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

interface AvailabilitySlot {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export default function AvailabilityPage() {
  const [slots, setSlots] = React.useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // New slot form state
  const [newDay, setNewDay] = React.useState<DayOfWeek>("monday");
  const [newStart, setNewStart] = React.useState("09:00");
  const [newEnd, setNewEnd] = React.useState("17:00");
  const [newDuration, setNewDuration] = React.useState(30);

  React.useEffect(() => {
    let ignore = false;
    fetch("/api/v1/doctors/availability")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ignore && json?.data) {
          setSlots(json.data);
        }
      })
      .catch((err) => console.error("Error loading availability:", err))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newStart >= newEnd) {
      toast.error("End time must be after start time");
      return;
    }

    // Check for duplicate day + start time
    const duplicate = slots.find(
      (s) => s.dayOfWeek === newDay && s.startTime === newStart
    );
    if (duplicate) {
      toast.error(
        `You already have a slot starting at ${newStart} on ${newDay}`
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/doctors/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: newDay,
          startTime: newStart,
          endTime: newEnd,
          slotDurationMinutes: newDuration,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add slot");

      setSlots((prev) => [...prev, json.data]);
      toast.success("Availability slot added successfully");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add availability";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setDeleting(slotId);
    try {
      const res = await fetch(
        `/api/v1/doctors/availability?id=${slotId}`,
        { method: "DELETE" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove slot");

      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Availability slot removed");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to remove slot";
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  // Group slots by day
  const groupedSlots = DAYS_OF_WEEK.map((day) => ({
    day,
    slots: slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Weekly Availability
        </h1>
        <p className="text-sm text-muted-foreground">
          Define the days and hours you are available for patient consultations.
          Patients will only be able to book during these windows.
        </p>
      </div>

      {/* Add New Slot Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Availability Window
          </CardTitle>
          <CardDescription>
            Set a recurring time block for a specific day of the week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSlot} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={newDay}
                  onValueChange={(v) => setNewDay(v as DayOfWeek)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Slot Duration (min)</Label>
                <Select
                  value={String(newDuration)}
                  onValueChange={(v) => setNewDuration(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add Slot
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Current Weekly Schedule
          </CardTitle>
          <CardDescription>
            {slots.length === 0
              ? "No availability set. Add time windows above so patients can book."
              : `${slots.length} availability slot${slots.length !== 1 ? "s" : ""} configured.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {slots.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                You have no availability configured. Patients cannot book
                appointments until you add at least one time window.
              </p>
            </div>
          )}

          {groupedSlots
            .filter((g) => g.slots.length > 0)
            .map(({ day, slots: daySlots }) => (
              <div key={day} className="space-y-2">
                <h3 className="text-sm font-semibold capitalize text-foreground">
                  {day}
                </h3>
                <div className="space-y-1.5">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-2.5 bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {slot.startTime.slice(0, 5)} –{" "}
                          {slot.endTime.slice(0, 5)}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {slot.slotDurationMinutes}min slots
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting === slot.id}
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        {deleting === slot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
