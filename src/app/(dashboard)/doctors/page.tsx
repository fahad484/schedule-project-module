"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Star,
  GraduationCap,
  Building,
  Filter,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import type { DoctorListItem, Specialty } from "@/types";

export default function DoctorsPage() {
  const [doctors, setDoctors] = React.useState<DoctorListItem[]>([]);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [search, setSearch] = React.useState("");
  const [specialtyId, setSpecialtyId] = React.useState<string>("all");
  const [loading, setLoading] = React.useState(true);

  // Fetch specialties
  React.useEffect(() => {
    async function fetchSpecialties() {
      try {
        const res = await fetch("/api/v1/specialties");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setSpecialties(json.data);
          }
        }
      } catch (err) {
        console.error("Error fetching specialties:", err);
      }
    }
    fetchSpecialties();
  }, []);

  // Fetch doctors
  const fetchDoctors = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (specialtyId && specialtyId !== "all") params.append("specialtyId", specialtyId);
      params.append("limit", "20");

      const res = await fetch(`/api/v1/doctors?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.items) {
          setDoctors(json.data.items);
          return;
        }
      }
      setDoctors([]);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, specialtyId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Find a Specialist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore qualified doctors, view available slots, and book your consultation online.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by doctor name or condition..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select value={specialtyId} onValueChange={setSpecialtyId}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Specialties" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map((spec) => (
                <SelectItem key={spec.id} value={spec.id}>
                  {spec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || (specialtyId && specialtyId !== "all")) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setSpecialtyId("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card
              key={doctor.id}
              className="flex flex-col transition-all duration-200 hover:shadow-md border-border/80"
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarImage src={doctor.image || ""} alt={doctor.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate text-foreground">
                    {doctor.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {doctor.specialtyName}
                    </Badge>
                  </div>
                  {doctor.hospitalAffiliation && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5 truncate">
                      <Building className="h-3 w-3 shrink-0" />
                      <span className="truncate">{doctor.hospitalAffiliation}</span>
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 pb-4">
                {doctor.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {doctor.bio}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span>{doctor.experienceYears} yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-medium">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {doctor.averageRating ? Number(doctor.averageRating).toFixed(1) : "New"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({doctor.totalReviews})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Consultation Fee</span>
                  <span className="font-bold text-base text-foreground">
                    ${Number(doctor.consultationFee).toFixed(2)}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button className="w-full gap-2" asChild>
                  <Link href={`/doctors/${doctor.id}`}>
                    <span>Book Appointment</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4 text-muted-foreground">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">No doctors found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            We couldn&apos;t find any doctors matching your current search or specialty criteria. Try resetting the filters.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSearch("");
              setSpecialtyId("all");
            }}
          >
            Reset Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
