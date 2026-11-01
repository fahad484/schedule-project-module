import { z } from "zod";

// ─── Auth Validations ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["patient", "doctor"]),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Doctor Profile Validations ─────────────────────────────────────

export const doctorProfileSchema = z.object({
  specialtyId: z.string().uuid("Please select a specialty"),
  bio: z.string().min(20, "Bio must be at least 20 characters").max(1000),
  qualifications: z.string().min(5, "Please enter your qualifications"),
  experienceYears: z.coerce
    .number()
    .int()
    .min(0, "Experience years must be positive")
    .max(60),
  consultationFee: z.coerce
    .number()
    .positive("Consultation fee must be positive")
    .max(10000),
  hospitalAffiliation: z.string().optional(),
  isAcceptingPatients: z.boolean().default(true),
});

export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;

// ─── Availability Validations ───────────────────────────────────────

export const availabilitySchema = z
  .object({
    dayOfWeek: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    slotDurationMinutes: z.coerce
      .number()
      .int()
      .min(10, "Minimum slot duration is 10 minutes")
      .max(120, "Maximum slot duration is 120 minutes")
      .default(30),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return startH * 60 + startM < endH * 60 + endM;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

// ─── Appointment Validations ────────────────────────────────────────

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor ID"),
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  reason: z
    .string()
    .min(5, "Please describe the reason for your visit")
    .max(500),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(5, "Please provide a cancellation reason").max(500),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// ─── Review Validations ─────────────────────────────────────────────

export const reviewSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().max(1000).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// ─── Specialty Validations ──────────────────────────────────────────

export const specialtySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export type SpecialtyInput = z.infer<typeof specialtySchema>;

// ─── Time Off Validations ───────────────────────────────────────────

export const timeOffSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    reason: z.string().max(500).optional(),
  })
  .refine(
    (data) => new Date(data.startDate) <= new Date(data.endDate),
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

export type TimeOffInput = z.infer<typeof timeOffSchema>;

// ─── Query Params ───────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const doctorSearchSchema = z.object({
  specialtyId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
