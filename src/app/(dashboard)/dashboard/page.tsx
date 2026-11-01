"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  CalendarDays,
  Star,
  DollarSign,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AdminStats, AppointmentWithDetails, DoctorStats, PatientStats } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [patientStats, setPatientStats] = React.useState<PatientStats | null>(null);
  const [doctorStats, setDoctorStats] = React.useState<DoctorStats | null>(null);
  const [adminStats, setAdminStats] = React.useState<AdminStats | null>(null);
  const [recentAppointments, setRecentAppointments] = React.useState<AppointmentWithDetails[]>([]);

  const userRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  React.useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch stats from API
        const res = await fetch("/api/v1/dashboard/stats").catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          if (json.data) {
            if (userRole === "admin") setAdminStats(json.data);
            else if (userRole === "doctor") setDoctorStats(json.data);
            else setPatientStats(json.data);
          }
        }

        // Fetch recent appointments
        const appRes = await fetch("/api/v1/appointments?limit=3").catch(() => null);
        if (appRes && appRes.ok) {
          const appJson = await appRes.json();
          if (appJson.data) {
            const list = Array.isArray(appJson.data) ? appJson.data : appJson.data.items || [];
            setRecentAppointments(list.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      loadDashboardData();
    }
  }, [session, userRole]);

  console.log("Recent Appointments:", recentAppointments);
  console.log("First Appointment:", recentAppointments?.[0]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome, {session?.user?.name || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is what&apos;s happening with your appointments and health schedule today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {userRole === "patient" && (
            <Button asChild className="shadow-sm">
              <Link href="/doctors">
                <PlusCircle className="mr-2 h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/appointments">
              <Calendar className="mr-2 h-4 w-4" />
              My Appointments
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : userRole === "admin" && adminStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {adminStats.totalDoctors} doctors, {adminStats.totalPatients} patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {adminStats.upcomingAppointments} upcoming visits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.completedAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {adminStats.cancelledAppointments} cancellations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${adminStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consultation transaction volume
              </p>
            </CardContent>
          </Card>
        </div>
      ) : userRole === "doctor" && doctorStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorStats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {doctorStats.upcomingAppointments} total upcoming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorStats.totalPatients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique patients treated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorStats.completedAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time consultations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating & Reviews</CardTitle>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctorStats.averageRating} / 5.0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {doctorStats.totalReviews} reviews
              </p>
            </CardContent>
          </Card>
        </div>
      ) : patientStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Visits</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientStats.upcomingAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled consultations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientStats.completedAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Past medical visits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doctors Visited</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientStats.totalDoctorsVisited}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Different specialists seen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientStats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime appointments
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick Action Section & Upcoming */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent / Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Appointments</h2>
            <Link
              href="/appointments"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : recentAppointments.length > 0 ? (
            <div className="space-y-3">
              {recentAppointments.map((app) => (
                <Card key={app.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {userRole === "doctor"
                          ? `Patient: ${app.patient?.name || "Patient"}`
                          : `Dr. ${app.doctor?.user?.name || "Doctor"}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.appointmentDate} at {app.startTime} - {app.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        Reason: {app.reason}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Badge variant={app.status === "confirmed" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3 text-muted-foreground">
                <CalendarDays className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No upcoming appointments scheduled</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Need medical advice or a routine check-up? Find a specialist and book your visit now.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/doctors">Browse Doctors</Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Links & Health Tips */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Link
                href="/doctors"
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Find Doctors</p>
                    <p className="text-xs text-muted-foreground">Search by specialty</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/appointments"
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Appointment History</p>
                    <p className="text-xs text-muted-foreground">Past and upcoming visits</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/notifications"
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-xs text-muted-foreground">Reminders & updates</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
