import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  date,
  time,
  pgEnum,
  uniqueIndex,
  index,
  varchar,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "doctor",
  "admin",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [ 
  "pending_payment",
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_booked",
  "appointment_confirmed",
  "appointment_cancelled",
  "appointment_rescheduled",
  "appointment_reminder",
  "review_received",
  "general",
]);

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

// ─── Users (Better Auth compatible) ─────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  role: userRoleEnum("role").notNull().default("patient"),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Specialties ────────────────────────────────────────────────────

export const specialty = pgTable("specialty", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Doctor Profiles ────────────────────────────────────────────────

export const doctorProfile = pgTable(
  "doctor_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    specialtyId: uuid("specialty_id")
      .notNull()
      .references(() => specialty.id),
    bio: text("bio"),
    qualifications: text("qualifications"),
    experienceYears: integer("experience_years").notNull().default(0),
    consultationFee: numeric("consultation_fee", {
      precision: 10,
      scale: 2,
    }).notNull(),
    hospitalAffiliation: varchar("hospital_affiliation", { length: 200 }),
    isAcceptingPatients: boolean("is_accepting_patients")
      .notNull()
      .default(true),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default(
      "0"
    ),
    totalReviews: integer("total_reviews").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_doctor_specialty").on(table.specialtyId),
    index("idx_doctor_accepting").on(table.isAcceptingPatients),
  ]
);

// ─── Doctor Availability (Weekly Schedule) ──────────────────────────

export const doctorAvailability = pgTable(
  "doctor_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctorProfile.id, { onDelete: "cascade" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_doctor_day_time").on(
      table.doctorId,
      table.dayOfWeek,
      table.startTime
    ),
    index("idx_availability_doctor").on(table.doctorId),
  ]
);

// ─── Doctor Time-Off / Unavailability ───────────────────────────────

export const doctorTimeOff = pgTable(
  "doctor_time_off",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctorProfile.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_timeoff_doctor").on(table.doctorId)]
);

// ─── Appointments ───────────────────────────────────────────────────

export const appointment = pgTable(
  "appointment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctorProfile.id, { onDelete: "cascade" }),
    appointmentDate: date("appointment_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    reason: text("reason"),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Critical: Prevents double-booking the same doctor at the same time
    uniqueIndex("idx_unique_doctor_slot").on(
      table.doctorId,
      table.appointmentDate,
      table.startTime
    ),
    index("idx_appointment_patient").on(table.patientId),
    index("idx_appointment_doctor").on(table.doctorId),
    index("idx_appointment_date").on(table.appointmentDate),
    index("idx_appointment_status").on(table.status),
  ]
);

// ─── Reviews ────────────────────────────────────────────────────────

export const review = pgTable(
  "review",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .unique()
      .references(() => appointment.id, { onDelete: "cascade" }),
    patientId: text("patient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctorProfile.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_review_doctor").on(table.doctorId),
    index("idx_review_patient").on(table.patientId),
  ]
);

// ─── Notifications ──────────────────────────────────────────────────

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    metadata: text("metadata"), // JSON string for extra data
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_notification_user").on(table.userId),
    index("idx_notification_read").on(table.userId, table.isRead),
  ]
);

// ─── Relations ──────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  doctorProfile: one(doctorProfile, {
    fields: [user.id],
    references: [doctorProfile.userId],
  }),
  appointments: many(appointment),
  reviews: many(review),
  notifications: many(notification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const specialtyRelations = relations(specialty, ({ many }) => ({
  doctors: many(doctorProfile),
}));

export const doctorProfileRelations = relations(
  doctorProfile,
  ({ one, many }) => ({
    user: one(user, {
      fields: [doctorProfile.userId],
      references: [user.id],
    }),
    specialty: one(specialty, {
      fields: [doctorProfile.specialtyId],
      references: [specialty.id],
    }),
    availability: many(doctorAvailability),
    timeOffs: many(doctorTimeOff),
    appointments: many(appointment),
    reviews: many(review),
  })
);

export const doctorAvailabilityRelations = relations(
  doctorAvailability,
  ({ one }) => ({
    doctor: one(doctorProfile, {
      fields: [doctorAvailability.doctorId],
      references: [doctorProfile.id],
    }),
  })
);

export const doctorTimeOffRelations = relations(doctorTimeOff, ({ one }) => ({
  doctor: one(doctorProfile, {
    fields: [doctorTimeOff.doctorId],
    references: [doctorProfile.id],
  }),
}));

export const appointmentRelations = relations(appointment, ({ one }) => ({
  patient: one(user, {
    fields: [appointment.patientId],
    references: [user.id],
  }),
  doctor: one(doctorProfile, {
    fields: [appointment.doctorId],
    references: [doctorProfile.id],
  }),
  review: one(review),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  appointment: one(appointment, {
    fields: [review.appointmentId],
    references: [appointment.id],
  }),
  patient: one(user, {
    fields: [review.patientId],
    references: [user.id],
  }),
  doctor: one(doctorProfile, {
    fields: [review.doctorId],
    references: [doctorProfile.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
// ----------payment gateway -----------------------------------
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),

    razorpayOrderId: varchar("razorpay_order_id", { length: 255 })
      .notNull()
      .unique(),

    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 })
      .unique(),

    razorpaySignature: varchar("razorpay_signature", { length: 500 }),

    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

    status: paymentStatusEnum("status").default("pending").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);