import { z } from 'zod';

const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  localStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  localEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  slotMinutes: z.number().int().min(10).max(240),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const availabilityInputSchema = z.object({
  rules: z.array(availabilityRuleSchema).min(1).max(21),
});

export const appointmentDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;
