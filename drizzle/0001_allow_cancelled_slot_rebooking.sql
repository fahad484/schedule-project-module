-- Custom SQL migration file, put your code below! --
DROP INDEX IF EXISTS idx_unique_doctor_slot;

CREATE UNIQUE INDEX idx_unique_doctor_slot
ON public.appointment (doctor_id, appointment_date, start_time)
WHERE status <> 'cancelled';