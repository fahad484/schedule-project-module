import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema/index";
import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Create .env.local from .env.example");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...\n");

  // ── Specialties ─────────────────────────────────────────────
  console.log("Creating or syncing specialties...");
  const specialtyList = [
    {
      name: "Cardiology",
      description: "Heart and cardiovascular system",
      icon: "HeartPulse",
    },
    {
      name: "Dermatology",
      description: "Skin, hair, and nail conditions",
      icon: "Scan",
    },
    {
      name: "Neurology",
      description: "Brain and nervous system disorders",
      icon: "Brain",
    },
    {
      name: "Orthopedics",
      description: "Bones, joints, and musculoskeletal system",
      icon: "Bone",
    },
    {
      name: "Pediatrics",
      description: "Medical care for children and adolescents",
      icon: "Baby",
    },
    {
      name: "General Medicine",
      description: "Primary care and general health",
      icon: "Stethoscope",
    },
    {
      name: "Ophthalmology",
      description: "Eye and vision care",
      icon: "Eye",
    },
    {
      name: "Psychiatry",
      description: "Mental health and behavioral disorders",
      icon: "BrainCircuit",
    },
  ];

  const existingSpecialties = await db.select().from(schema.specialty);
  const specialtyMap = new Map<string, string>();

  for (const s of existingSpecialties) {
    specialtyMap.set(s.name, s.id);
  }

  for (const spec of specialtyList) {
    if (!specialtyMap.has(spec.name)) {
      const [inserted] = await db
        .insert(schema.specialty)
        .values({
          id: randomUUID(),
          name: spec.name,
          description: spec.description,
          icon: spec.icon,
        })
        .returning();
      specialtyMap.set(inserted.name, inserted.id);
      console.log(`  + Created specialty: ${inserted.name}`);
    }
  }

  console.log(`  ✓ Total specialties verified: ${specialtyMap.size}`);

  // ── Password Hash ──────────────────────────────────────────
  const defaultPassword = "Password123!";
  const hashedPassword = await hashPassword(defaultPassword);

  // ── Demo Users ─────────────────────────────────────────────
  console.log("\nCreating demo users and accounts...");

  const demoUsers = [
    {
      email: "admin@medbook.com",
      name: "System Admin",
      role: "admin" as const,
      phone: "+1 (555) 000-0001",
    },
    {
      email: "doctor.jenkins@medbook.com",
      name: "Dr. Sarah Jenkins",
      role: "doctor" as const,
      phone: "+1 (555) 234-5678",
      address: "Suite 302, Metro Medical Center, New York, NY",
    },
    {
      email: "doctor.chen@medbook.com",
      name: "Dr. Marcus Chen",
      role: "doctor" as const,
      phone: "+1 (555) 876-5432",
      address: "742 Evergreen Plaza, San Francisco, CA",
    },
    {
      email: "patient.john@medbook.com",
      name: "John Doe",
      role: "patient" as const,
      phone: "+1 (555) 987-6543",
      address: "123 Health Ave, Suite 400, Chicago, IL",
      dateOfBirth: "1988-06-15",
    },
  ];

  const userMap = new Map<string, string>();

  for (const u of demoUsers) {
    const [existing] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, u.email))
      .limit(1);

    if (existing) {
      userMap.set(u.email, existing.id);
      console.log(`  • User already exists: ${u.email} (${existing.role})`);
    } else {
      const userId = randomUUID();
      await db.insert(schema.user).values({
        id: userId,
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
        phone: u.phone,
        address: u.address || null,
        dateOfBirth: u.dateOfBirth || null,
      });

      await db.insert(schema.account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      });

      userMap.set(u.email, userId);
      console.log(`  + Created user: ${u.email} (${u.role})`);
    }
  }

  // ── Doctor Profiles ────────────────────────────────────────
  console.log("\nConfiguring doctor profiles...");

  const drJenkinsUserId = userMap.get("doctor.jenkins@medbook.com");
  const cardiologyId = specialtyMap.get("Cardiology");
  let drJenkinsProfileId: string | undefined;

  if (drJenkinsUserId && cardiologyId) {
    const [existingProf] = await db
      .select()
      .from(schema.doctorProfile)
      .where(eq(schema.doctorProfile.userId, drJenkinsUserId))
      .limit(1);

    if (existingProf) {
      drJenkinsProfileId = existingProf.id;
      console.log("  • Dr. Jenkins profile already exists");
    } else {
      const [prof] = await db
        .insert(schema.doctorProfile)
        .values({
          id: randomUUID(),
          userId: drJenkinsUserId,
          specialtyId: cardiologyId,
          bio: "Board-certified cardiologist with over 14 years of clinical experience specializing in preventive cardiology, heart rhythm disorders, and comprehensive cardiac rehabilitation.",
          qualifications: "MD, FACC - Harvard Medical School",
          experienceYears: 14,
          consultationFee: "150.00",
          hospitalAffiliation: "Metro General Hospital",
          isAcceptingPatients: true,
          averageRating: "5.00",
          totalReviews: 1,
        })
        .returning();
      drJenkinsProfileId = prof.id;
      console.log("  + Created Dr. Jenkins Cardiology profile");
    }
  }

  const drChenUserId = userMap.get("doctor.chen@medbook.com");
  const dermatologyId = specialtyMap.get("Dermatology");
  let drChenProfileId: string | undefined;

  if (drChenUserId && dermatologyId) {
    const [existingProf] = await db
      .select()
      .from(schema.doctorProfile)
      .where(eq(schema.doctorProfile.userId, drChenUserId))
      .limit(1);

    if (existingProf) {
      drChenProfileId = existingProf.id;
      console.log("  • Dr. Chen profile already exists");
    } else {
      const [prof] = await db
        .insert(schema.doctorProfile)
        .values({
          id: randomUUID(),
          userId: drChenUserId,
          specialtyId: dermatologyId,
          bio: "Specialist in clinical dermatology, skin cancer screenings, and advanced dermatological laser procedures.",
          qualifications: "MD, FAAD - Johns Hopkins University",
          experienceYears: 9,
          consultationFee: "120.00",
          hospitalAffiliation: "City Center Dermatology Clinic",
          isAcceptingPatients: true,
          averageRating: "0.00",
          totalReviews: 0,
        })
        .returning();
      drChenProfileId = prof.id;
      console.log("  + Created Dr. Marcus Chen Dermatology profile");
    }
  }

  // ── Doctor Availability ─────────────────────────────────────
  console.log("\nConfiguring doctor availability...");

  if (drJenkinsProfileId) {
    const days: Array<"monday" | "tuesday" | "wednesday" | "thursday" | "friday"> = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];

    for (const day of days) {
      // Check if this day is already configured
      const daySlots = await db
        .select()
        .from(schema.doctorAvailability)
        .where(eq(schema.doctorAvailability.doctorId, drJenkinsProfileId));

      const hasDay = daySlots.some((s) => s.dayOfWeek === day);

      if (!hasDay) {
        await db.insert(schema.doctorAvailability).values({
          id: randomUUID(),
          doctorId: drJenkinsProfileId,
          dayOfWeek: day,
          startTime: "09:00:00",
          endTime: "17:00:00",
          slotDurationMinutes: 30,
          isActive: true,
        });
      }
    }
    console.log("  ✓ Dr. Jenkins Mon-Fri (09:00 - 17:00) schedule configured");
  }

  if (drChenProfileId) {
    const days: Array<"monday" | "tuesday" | "wednesday"> = [
      "monday",
      "tuesday",
      "wednesday",
    ];

    const daySlots = await db
      .select()
      .from(schema.doctorAvailability)
      .where(eq(schema.doctorAvailability.doctorId, drChenProfileId));

    for (const day of days) {
      const hasDay = daySlots.some((s) => s.dayOfWeek === day);
      if (!hasDay) {
        await db.insert(schema.doctorAvailability).values({
          id: randomUUID(),
          doctorId: drChenProfileId,
          dayOfWeek: day,
          startTime: "10:00:00",
          endTime: "16:00:00",
          slotDurationMinutes: 30,
          isActive: true,
        });
      }
    }
    console.log("  ✓ Dr. Chen Mon-Wed (10:00 - 16:00) schedule configured");
  }

  // ── Sample Appointments & Reviews ───────────────────────────
  console.log("\nConfiguring sample appointments and reviews...");

  const patientId = userMap.get("patient.john@medbook.com");

  if (patientId && drJenkinsProfileId) {
    const existingAppts = await db
      .select()
      .from(schema.appointment)
      .where(eq(schema.appointment.patientId, patientId));

    // Completed appointment
    let completedApptId: string;
    const existingCompleted = existingAppts.find((a) => a.status === "completed");

    if (existingCompleted) {
      completedApptId = existingCompleted.id;
      console.log("  • Sample completed appointment already exists");
    } else {
      const [appt] = await db
        .insert(schema.appointment)
        .values({
          id: randomUUID(),
          patientId: patientId,
          doctorId: drJenkinsProfileId,
          appointmentDate: "2026-10-25",
          startTime: "10:00:00",
          endTime: "10:30:00",
          status: "completed",
          reason: "Annual cardiac checkup and blood pressure monitoring",
          notes: "Patient in good cardiovascular health, routine ECG clear. Recommended continued daily exercise.",
        })
        .returning();
      completedApptId = appt.id;
      console.log("  + Created completed appointment");
    }

    // Verified Review for completed appointment
    const [existingReview] = await db
      .select()
      .from(schema.review)
      .where(eq(schema.review.appointmentId, completedApptId))
      .limit(1);

    if (existingReview) {
      console.log("  • Sample review already exists");
    } else {
      await db.insert(schema.review).values({
        id: randomUUID(),
        appointmentId: completedApptId,
        patientId: patientId,
        doctorId: drJenkinsProfileId,
        rating: 5,
        comment: "Dr. Jenkins was extremely thorough and attentive. Answered all my concerns about heart health.",
      });
      console.log("  + Created verified 5-star patient review");
    }

    // Scheduled upcoming appointment
    const existingUpcoming = existingAppts.find((a) => a.status === "confirmed" || a.status === "scheduled");

    if (existingUpcoming) {
      console.log("  • Sample upcoming appointment already exists");
    } else {
      await db.insert(schema.appointment).values({
        id: randomUUID(),
        patientId: patientId,
        doctorId: drJenkinsProfileId,
        appointmentDate: "2026-11-02",
        startTime: "14:00:00",
        endTime: "14:30:00",
        status: "confirmed",
        reason: "Follow-up evaluation on blood pressure medication",
      });
      console.log("  + Created confirmed upcoming appointment");
    }
  }

  console.log("\n==========================================");
  console.log("✅ Database seeding complete!");
  console.log("==========================================");
  console.log("\nDemo Test Accounts (Password: Password123!):");
  console.log("  • Admin:   admin@medbook.com");
  console.log("  • Doctor:  doctor.jenkins@medbook.com (Cardiology)");
  console.log("  • Doctor:  doctor.chen@medbook.com (Dermatology)");
  console.log("  • Patient: patient.john@medbook.com");
  console.log("\nAvailable features to test:");
  console.log("  • /doctors               -> Browse real seeded doctors & specialties");
  console.log("  • /dashboard             -> Real aggregates for patient/doctor/admin");
  console.log("  • /appointments          -> Review completed appointment, manage upcoming");
  console.log("  • /dashboard/schedule    -> Doctor daily schedule management");
  console.log("  • /dashboard/availability-> Doctor weekly schedule configuration");
  console.log("  • /dashboard/profile     -> Doctor professional profile management");
  console.log("  • /dashboard/reviews     -> Doctor patient review showcase");
  console.log("  • /dashboard/users       -> Admin user directory and role changer");
  console.log("  • /dashboard/specialties -> Admin medical specialties manager");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
