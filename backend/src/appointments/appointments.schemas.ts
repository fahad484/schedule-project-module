import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
