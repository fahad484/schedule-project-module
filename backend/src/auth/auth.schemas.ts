import { z } from 'zod';

const credentials = {
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128),
};

export const loginSchema = z.object(credentials);
export type LoginDto = z.infer<typeof loginSchema>;

const patientRegistrationSchema = z.object({
  ...credentials,
  role: z.literal('PATIENT'),
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32).optional(),
});

const doctorRegistrationSchema = z.object({
  ...credentials,
  role: z.literal('DOCTOR'),
  doctorSignupCode: z.string().min(1).max(256),
  fullName: z.string().trim().min(2).max(160),
  specialty: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(3000).optional(),
  licenseNumber: z.string().trim().max(120).optional(),
  consultationFeeCents: z.number().int().min(0).max(100_000_000).optional(),
  timeZone: z.string().trim().min(1).max(64).optional(),
});

export const registerSchema = z.discriminatedUnion('role', [
  patientRegistrationSchema,
  doctorRegistrationSchema,
]);
export type RegisterDto = z.infer<typeof registerSchema>;
