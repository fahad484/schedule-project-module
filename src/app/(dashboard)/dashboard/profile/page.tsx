"use client";

import * as React from "react";
import Link from "next/link";
import {
  Stethoscope,
  Building,
  GraduationCap,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  Calendar,
  Save,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Specialty } from "@/types";

interface DoctorProfileData {
  id: string;
  userId: string;
  specialtyId: string;
  bio: string | null;
  qualifications: string | null;
  experienceYears: number;
  consultationFee: string;
  hospitalAffiliation: string | null;
  isAcceptingPatients: boolean;
  averageRating: string | null;
  totalReviews: number;
  specialty?: Specialty;
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export default function ProfilePage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [specialties, setSpecialties] = React.useState<Specialty[]>([]);
  const [doctorProfile, setDoctorProfile] = React.useState<DoctorProfileData | null>(null);

  // Form fields for Doctor Profile
  const [specialtyId, setSpecialtyId] = React.useState("");
  const [qualifications, setQualifications] = React.useState("");
  const [experienceYears, setExperienceYears] = React.useState<number>(5);
  const [consultationFee, setConsultationFee] = React.useState<number>(100);
  const [hospitalAffiliation, setHospitalAffiliation] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [isAcceptingPatients, setIsAcceptingPatients] = React.useState(true);

  const userRole = ((session?.user as { role?: string })?.role || "patient").toLowerCase();

  // Load Doctor Profile & Specialties
  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        if (userRole === "doctor") {
          const [specRes, profRes] = await Promise.all([
            fetch("/api/v1/specialties").catch(() => null),
            fetch("/api/v1/doctors/profile").catch(() => null),
          ]);

          if (specRes && specRes.ok) {
            const specJson = await specRes.json();
            if (!ignore && specJson.data) {
              setSpecialties(specJson.data);
            }
          }

          if (profRes && profRes.ok) {
            const profJson = await profRes.json();
            if (!ignore && profJson.data) {
              const p = profJson.data as DoctorProfileData;
              setDoctorProfile(p);
              setSpecialtyId(p.specialtyId || "");
              setQualifications(p.qualifications || "");
              setExperienceYears(p.experienceYears || 0);
              setConsultationFee(parseFloat(p.consultationFee) || 100);
              setHospitalAffiliation(p.hospitalAffiliation || "");
              setBio(p.bio || "");
              setIsAcceptingPatients(p.isAcceptingPatients ?? true);
            }
          }
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    if (session?.user) {
      loadData();
    }

    return () => {
      ignore = true;
    };
  }, [session, sessionLoading, userRole]);

  // Handle Doctor Profile Submit (Create or Update)
  const handleSubmitDoctorProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!specialtyId) {
      toast.error("Please select your medical specialty");
      return;
    }

    if (!qualifications.trim() || qualifications.length < 3) {
      toast.error("Please enter your qualifications (minimum 3 characters)");
      return;
    }

    if (!bio.trim() || bio.length < 20) {
      toast.error("Please enter a bio of at least 20 characters describing your practice");
      return;
    }

    if (consultationFee <= 0) {
      toast.error("Consultation fee must be greater than zero");
      return;
    }

    setSaving(true);
    try {
      const isUpdate = Boolean(doctorProfile);
      const url = "/api/v1/doctors/profile";
      const method = isUpdate ? "PUT" : "POST";

      const payload = {
        specialtyId,
        qualifications: qualifications.trim(),
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        hospitalAffiliation: hospitalAffiliation.trim() || undefined,
        bio: bio.trim(),
        isAcceptingPatients,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save profile");
      }

      setDoctorProfile(json.data);
      toast.success(
        isUpdate
          ? "Professional profile updated successfully!"
          : "Profile created! You are now discoverable in the doctor directory."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ── PATIENT / ADMIN VIEW ───────────────────────────────────────────────
  if (userRole !== "doctor") {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile and account credentials.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(session?.user?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{session?.user?.name || "User"}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{session?.user?.email}</span>
                <Badge variant="secondary" className="capitalize text-xs">
                  {userRole}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <User className="h-3.5 w-3.5" /> Full Name
                </span>
                <p className="text-sm font-semibold">{session?.user?.name || "Not specified"}</p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </span>
                <p className="text-sm font-semibold">{session?.user?.email || "Not specified"}</p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </span>
                <p className="text-sm font-semibold">
                  {(session?.user as { phone?: string })?.phone || "Not provided"}
                </p>
              </div>

              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Account Role
                </span>
                <p className="text-sm font-semibold capitalize">{userRole}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/appointments">View My Appointments</Link>
            </Button>
            <Button asChild>
              <Link href="/doctors">Find a Doctor</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ── DOCTOR VIEW ─────────────────────────────────────────────────────────
  const isProfileExisting = Boolean(doctorProfile);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doctor Professional Profile</h1>
          <p className="text-sm text-muted-foreground">
            {isProfileExisting
              ? "Update your clinical credentials, consultation fees, and practice details."
              : "Complete your medical credentials so patients can discover and book consultations with you."}
          </p>
        </div>

        {isProfileExisting && (
          <Button variant="outline" size="sm" asChild className="gap-2 shrink-0">
            <Link href={`/doctors/${doctorProfile?.id}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              View Public Page
            </Link>
          </Button>
        )}
      </div>

      {/* Onboarding Notice if Profile Doesn't Exist */}
      {!isProfileExisting && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">Action Required: Profile Setup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your doctor account is created, but you do not have an active medical profile yet. Fill in
              your specialty, qualifications, and consultation fee below to publish your profile and begin
              accepting patient appointments.
            </p>
          </div>
        </div>
      )}

      {/* Doctor Summary Overview if Profile Exists */}
      {isProfileExisting && (
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-border">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                    {getInitials(session?.user?.name || "Dr")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {session?.user?.name || "Doctor"}
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {doctorProfile?.specialty?.name || "Specialist"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {doctorProfile?.hospitalAffiliation || "Private Practice"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="text-center sm:text-right">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                    <Star className="h-4 w-4 fill-amber-500" />
                    <span>{doctorProfile?.averageRating || "5.0"}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {doctorProfile?.totalReviews || 0} Reviews
                  </span>
                </div>

                <div className="text-center sm:text-right pl-4 border-l">
                  <Badge
                    variant={isAcceptingPatients ? "default" : "outline"}
                    className="text-xs"
                  >
                    {isAcceptingPatients ? "Accepting Patients" : "Not Accepting"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitDoctorProfile} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice & Specialty Details</CardTitle>
            <CardDescription>
              This information is displayed publicly to patients searching for care.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Specialty Selection */}
              <div className="space-y-2">
                <Label htmlFor="specialty">
                  Medical Specialty <span className="text-destructive">*</span>
                </Label>
                <Select value={specialtyId} onValueChange={setSpecialtyId}>
                  <SelectTrigger id="specialty" className="w-full">
                    <SelectValue placeholder="Select primary specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((spec) => (
                      <SelectItem key={spec.id} value={spec.id}>
                        {spec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The primary clinical field under which your profile will be categorized.
                </p>
              </div>

              {/* Consultation Fee */}
              <div className="space-y-2">
                <Label htmlFor="fee">
                  Consultation Fee ($ USD) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fee"
                    type="number"
                    min="10"
                    max="5000"
                    step="5"
                    className="pl-9"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Standard consultation fee per appointment slot.
                </p>
              </div>

              {/* Qualifications */}
              <div className="space-y-2">
                <Label htmlFor="qualifications">
                  Degrees & Qualifications <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="qualifications"
                    placeholder="e.g. MD, FACC, Harvard Medical School"
                    className="pl-9"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Experience Years */}
              <div className="space-y-2">
                <Label htmlFor="experience">
                  Years of Practice Experience <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="60"
                    className="pl-9"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Hospital Affiliation */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hospital">Hospital / Clinic Affiliation</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hospital"
                    placeholder="e.g. Metropolitan Central Hospital, Suite 402"
                    className="pl-9"
                    value={hospitalAffiliation}
                    onChange={(e) => setHospitalAffiliation(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio">
                  Professional Biography <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Describe your medical background, treatment philosophies, and clinical specializations..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimum 20 characters. Patients read this to understand your clinical background.
                </p>
              </div>

              {/* Accepting Patients Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4 md:col-span-2 bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="accepting" className="text-sm font-semibold cursor-pointer">
                    Accepting New Patients
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, your profile will be hidden from patient directory search results.
                  </p>
                </div>
                <Switch
                  id="accepting"
                  checked={isAcceptingPatients}
                  onCheckedChange={setIsAcceptingPatients}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t p-4 flex justify-end gap-3">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isProfileExisting ? "Update Profile" : "Create Profile"}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
