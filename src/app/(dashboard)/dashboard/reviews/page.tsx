"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewItem {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface DoctorProfileSummary {
  id: string;
  averageRating: string | null;
  totalReviews: number;
  specialty?: {
    name: string;
  };
}

export default function DoctorReviewsPage() {
  const [profile, setProfile] = React.useState<DoctorProfileSummary | null>(null);
  const [profileMissing, setProfileMissing] = React.useState(false);
  const [reviews, setReviews] = React.useState<ReviewItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  // Load doctor profile first, then reviews
  React.useEffect(() => {
    let ignore = false;

    async function loadProfileAndReviews() {
      try {
        const profRes = await fetch("/api/v1/doctors/profile");
        if (!profRes.ok) {
          if (!ignore) {
            setProfileMissing(true);
            setLoading(false);
          }
          return;
        }

        const profJson = await profRes.json();
        const docProfile = profJson.data as DoctorProfileSummary;
        if (!ignore) {
          setProfile(docProfile);
        }

        if (docProfile?.id) {
          const revRes = await fetch(`/api/v1/doctors/${docProfile.id}/reviews?page=${page}&limit=10`);
          if (revRes.ok) {
            const revJson = await revRes.json();
            if (!ignore && revJson.data) {
              setReviews(revJson.data.items || []);
              setTotalPages(revJson.data.totalPages || 1);
              setTotalCount(revJson.data.total || 0);
            }
          }
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProfileAndReviews();

    return () => {
      ignore = true;
    };
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (profileMissing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
          <Stethoscope className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-lg font-bold">Doctor Profile Required</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You must set up your medical profile and specialty before patient reviews can be recorded.
          </p>
          <Button asChild>
            <Link href="/dashboard/profile">Set Up Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const ratingValue = parseFloat(profile?.averageRating || "5.0") || 5.0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patient Reviews & Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Verified reviews submitted by patients following completed consultations.
        </p>
      </div>

      {/* Summary Score Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-amber-500/10 p-5 min-w-[100px]">
                <span className="text-4xl font-extrabold text-amber-500 leading-none">
                  {profile?.averageRating ? parseFloat(profile.averageRating).toFixed(1) : "5.0"}
                </span>
                <div className="flex items-center gap-0.5 mt-2 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < Math.round(ratingValue) ? "fill-current" : "opacity-30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-base">Overall Patient Satisfaction</h3>
                <p className="text-xs text-muted-foreground">
                  Based on {totalCount} verified post-consultation review{totalCount !== 1 ? "s" : ""}.
                </p>
                <Badge variant="secondary" className="text-xs mt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary mr-1" />
                  Verified Consultations Only
                </Badge>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 sm:max-w-xs">
              Patients are automatically prompted to review their experience once an appointment is marked as completed.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Patient Feedback</span>
            <span className="text-xs font-normal text-muted-foreground">
              {totalCount} Total
            </span>
          </CardTitle>
          <CardDescription>
            Real feedback from verified patient consultations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No patient reviews recorded yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once you complete appointments and patients submit feedback, their reviews and ratings will appear here.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-lg border p-4 space-y-3 bg-card hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={rev.patient?.image || ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(rev.patient?.name || "Patient")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{rev.patient?.name || "Verified Patient"}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rev.rating ? "fill-current" : "opacity-20"}`}
                      />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-muted-foreground leading-relaxed pl-12">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                )}
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
