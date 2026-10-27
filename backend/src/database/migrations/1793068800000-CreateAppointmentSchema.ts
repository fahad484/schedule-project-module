import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointmentSchema1793068800000 implements MigrationInterface {
  name = 'CreateAppointmentSchema1793068800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS btree_gist');

    await queryRunner.query(`CREATE TYPE user_role_enum AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN')`);
    await queryRunner.query(`CREATE TYPE appointment_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
    await queryRunner.query(`CREATE TYPE notification_channel_enum AS ENUM ('EMAIL', 'SMS', 'IN_APP')`);
    await queryRunner.query(`CREATE TYPE notification_status_enum AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED')`);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(320) NOT NULL,
        password_hash varchar(255) NOT NULL,
        role user_role_enum NOT NULL,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query('CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email))');

    await queryRunner.query(`
      CREATE TABLE patients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE,
        full_name varchar(160) NOT NULL,
        phone varchar(32),
        date_of_birth date,
        gender varchar(32),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT patients_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE doctors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE,
        full_name varchar(160) NOT NULL,
        specialty varchar(120) NOT NULL,
        bio text,
        license_number varchar(120) UNIQUE,
        phone varchar(32),
        consultation_fee_cents integer NOT NULL DEFAULT 0,
        time_zone varchar(64) NOT NULL DEFAULT 'UTC',
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT doctors_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query('ALTER TABLE doctors ADD CONSTRAINT doctors_consultation_fee_ck CHECK (consultation_fee_cents >= 0)');

    await queryRunner.query(`
      CREATE TABLE availabilities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id uuid NOT NULL,
        weekday smallint NOT NULL,
        local_start time NOT NULL,
        local_end time NOT NULL,
        slot_minutes smallint NOT NULL,
        valid_from date NOT NULL,
        valid_until date,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT availabilities_doctor_id_fk FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
        CONSTRAINT availabilities_weekday_ck CHECK (weekday BETWEEN 1 AND 7),
        CONSTRAINT availabilities_time_range_ck CHECK (local_end > local_start),
        CONSTRAINT availabilities_slot_minutes_ck CHECK (slot_minutes BETWEEN 5 AND 240),
        CONSTRAINT availabilities_valid_dates_ck CHECK (valid_until IS NULL OR valid_until >= valid_from)
      )
    `);
    await queryRunner.query('CREATE INDEX availabilities_doctor_weekday_idx ON availabilities (doctor_id, weekday)');

    await queryRunner.query(`
      CREATE TABLE appointments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id uuid NOT NULL,
        doctor_id uuid NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        status appointment_status_enum NOT NULL DEFAULT 'CONFIRMED',
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT appointments_patient_id_fk FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
        CONSTRAINT appointments_doctor_id_fk FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
        CONSTRAINT appointments_positive_duration_ck CHECK (ends_at > starts_at),
        CONSTRAINT appointments_doctor_active_time_excl EXCLUDE USING gist (
          doctor_id WITH =,
          tstzrange(starts_at, ends_at, '[)') WITH &&
        ) WHERE (status IN ('PENDING', 'CONFIRMED'))
      )
    `);
    await queryRunner.query('CREATE INDEX appointments_patient_start_idx ON appointments (patient_id, starts_at)');
    await queryRunner.query('CREATE INDEX appointments_doctor_start_idx ON appointments (doctor_id, starts_at)');

    await queryRunner.query(`
      CREATE TABLE notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id uuid NOT NULL,
        recipient_user_id uuid NOT NULL,
        event_type varchar(80) NOT NULL,
        channel notification_channel_enum NOT NULL,
        status notification_status_enum NOT NULL DEFAULT 'QUEUED',
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        attempt_count integer NOT NULL DEFAULT 0,
        available_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        delivered_at timestamptz,
        last_error text,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT notifications_appointment_id_fk FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT,
        CONSTRAINT notifications_recipient_user_id_fk FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT notifications_attempt_count_ck CHECK (attempt_count >= 0)
      )
    `);
    await queryRunner.query('CREATE INDEX notifications_delivery_queue_idx ON notifications (status, available_at)');
    await queryRunner.query('CREATE INDEX notifications_appointment_idx ON notifications (appointment_id)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE notifications');
    await queryRunner.query('DROP TABLE appointments');
    await queryRunner.query('DROP TABLE availabilities');
    await queryRunner.query('DROP TABLE doctors');
    await queryRunner.query('DROP TABLE patients');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TYPE notification_status_enum');
    await queryRunner.query('DROP TYPE notification_channel_enum');
    await queryRunner.query('DROP TYPE appointment_status_enum');
    await queryRunner.query('DROP TYPE user_role_enum');
  }
}
