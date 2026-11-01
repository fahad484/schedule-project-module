"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server-utils";
import {
  getDoctorProfile,
  updateDoctorProfile,
  setDoctorAvailability,
  removeDoctorAvailability,
} from "@/services/doctor.service";
import { availabilitySchema } from "@/lib/validations";

export async function updateDoctorProfileAction(data: {
  bio?: string;
  qualifications?: string;
  experienceYears?: number;
  consultationFee?: number;
  hospitalAffiliation?: string;
  isAcceptingPatients?: boolean;
}) {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  const updated = await updateDoctorProfile(profile.id, data);
  revalidatePath("/dashboard");
  revalidatePath("/doctors");
  return { success: true, data: updated };
}

export async function setDoctorAvailabilityAction(data: {
  dayOfWeek: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}) {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  const validated = availabilitySchema.parse(data);
  const result = await setDoctorAvailability(profile.id, validated);
  revalidatePath("/dashboard");
  return { success: true, data: result };
}

export async function removeDoctorAvailabilityAction(availabilityId: string) {
  const session = await requireRole("doctor");
  const profile = await getDoctorProfile(session.user.id);
  if (!profile) {
    throw new Error("Doctor profile not found");
  }

  const result = await removeDoctorAvailability(availabilityId, profile.id);
  revalidatePath("/dashboard");
  return { success: true, data: result };
}
