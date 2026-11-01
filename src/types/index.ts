import type { InferSelectModel } from "drizzle-orm";
import type {
  user,
  specialty,
  doctorProfile,
  doctorAvailability,
  doctorTimeOff,
  appointment,
  review,
  notification,
} from "@/db/schema";

// ─── Base Types ─────────────────────────────────────────────────────

export type User = InferSelectModel<typeof user>;
export type Specialty = InferSelectModel<typeof specialty>;
export type DoctorProfile = InferSelectModel<typeof doctorProfile>;
export type DoctorAvailability = InferSelectModel<typeof doctorAvailability>;
export type DoctorTimeOff = InferSelectModel<typeof doctorTimeOff>;
export type Appointment = InferSelectModel<typeof appointment>;
export type Review = InferSelectModel<typeof review>;
export type Notification = InferSelectModel<typeof notification>;

// ─── Role Types ─────────────────────────────────────────────────────

export type UserRole = "patient" | "doctor" | "admin";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// ─── Composite Types ────────────────────────────────────────────────

export type DoctorWithProfile = User & {
  doctorProfile: DoctorProfile & {
    specialty: Specialty;
  };
};

export type DoctorListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  specialtyName: string;
  specialtyId: string;
  bio: string | null;
  qualifications: string | null;
  experienceYears: number;
  consultationFee: string;
  hospitalAffiliation: string | null;
  isAcceptingPatients: boolean;
  averageRating: string | null;
  totalReviews: number;
};

export type AppointmentWithDetails = Appointment & {
  patient: Pick<User, "id" | "name" | "email" | "image" | "phone">;
  doctor: DoctorProfile & {
    user: Pick<User, "id" | "name" | "email" | "image">;
    specialty: Specialty;
  };
};

export type ReviewWithDetails = Review & {
  patient: Pick<User, "id" | "name" | "image">;
  doctor: DoctorProfile & {
    user: Pick<User, "id" | "name" | "image">;
  };
};

export type TimeSlot = {
  start: string;
  end: string;
  isAvailable: boolean;
};

// ─── API Response Types ─────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

// ─── Dashboard Stats ────────────────────────────────────────────────

export type AdminStats = {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
};

export type DoctorStats = {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  averageRating: number;
  totalReviews: number;
  todayAppointments: number;
};

export type PatientStats = {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalDoctorsVisited: number;
};
