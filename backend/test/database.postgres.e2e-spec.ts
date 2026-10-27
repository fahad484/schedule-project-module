import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { createDatabaseOptions } from '../src/database/data-source';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describePostgres = testDatabaseUrl ? describe : describe.skip;

describePostgres('PostgreSQL appointment constraints', () => {
  let dataSource: DataSource | undefined;
  let patientId: string;
  let secondPatientId: string;
  let doctorId: string;
  let secondDoctorId: string;

  const startsAt = '2035-03-12T10:00:00.000Z';
  const endsAt = '2035-03-12T11:00:00.000Z';

  function db(): DataSource {
    if (!dataSource) throw new Error('PostgreSQL test DataSource is not initialized.');
    return dataSource;
  }

  async function createUser(role: 'PATIENT' | 'DOCTOR'): Promise<string> {
    const email = `${role.toLowerCase()}-${randomUUID()}@example.test`;
    const rows: Array<{ id: string }> = await db().query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
      [email, 'not-a-real-password-hash', role],
    );
    return rows[0].id;
  }

  async function createPatient(): Promise<string> {
    const userId = await createUser('PATIENT');
    const rows: Array<{ id: string }> = await db().query(
      'INSERT INTO patients (user_id, full_name) VALUES ($1, $2) RETURNING id',
      [userId, 'Test Patient'],
    );
    return rows[0].id;
  }

  async function createDoctor(): Promise<string> {
    const userId = await createUser('DOCTOR');
    const rows: Array<{ id: string }> = await db().query(
      `INSERT INTO doctors (user_id, full_name, specialty) VALUES ($1, 'Test Doctor', 'Family Medicine') RETURNING id`,
      [userId],
    );
    return rows[0].id;
  }

  async function insertAppointment(
    patient: string,
    doctor: string,
    starts: string,
    ends: string,
    status = 'CONFIRMED',
  ): Promise<void> {
    await db().query(
      `INSERT INTO appointments (patient_id, doctor_id, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [patient, doctor, starts, ends, status],
    );
  }

  beforeAll(async () => {
    if (!testDatabaseUrl) return;
    dataSource = new DataSource(createDatabaseOptions(testDatabaseUrl));
    await db().initialize();
    await db().runMigrations();
  });

  beforeEach(async () => {
    if (!testDatabaseUrl) return;
    // TEST_DATABASE_URL must point to a disposable, dedicated test database.
    await db().query(
      'TRUNCATE TABLE notifications, appointments, availabilities, patients, doctors, users CASCADE',
    );
    patientId = await createPatient();
    secondPatientId = await createPatient();
    doctorId = await createDoctor();
    secondDoctorId = await createDoctor();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('rejects overlapping active appointments for one doctor', async () => {
    await insertAppointment(patientId, doctorId, startsAt, endsAt);

    await expect(
      insertAppointment(secondPatientId, doctorId, '2035-03-12T10:30:00.000Z', '2035-03-12T11:30:00.000Z'),
    ).rejects.toMatchObject({ driverError: { code: '23P01', constraint: 'appointments_doctor_active_time_excl' } });
  });

  it('allows only one of two concurrent overlapping booking attempts', async () => {
    const results = await Promise.allSettled([
      insertAppointment(patientId, doctorId, startsAt, endsAt),
      insertAppointment(secondPatientId, doctorId, startsAt, endsAt),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: { driverError: { code: '23P01', constraint: 'appointments_doctor_active_time_excl' } },
    });
  });

  it('allows non-overlapping appointments for the same doctor', async () => {
    await insertAppointment(patientId, doctorId, startsAt, endsAt);
    await expect(
      insertAppointment(secondPatientId, doctorId, '2035-03-12T11:00:00.000Z', '2035-03-12T12:00:00.000Z'),
    ).resolves.toBeUndefined();
  });

  it('allows appointments at the same time with different doctors', async () => {
    await insertAppointment(patientId, doctorId, startsAt, endsAt);
    await expect(
      insertAppointment(secondPatientId, secondDoctorId, startsAt, endsAt),
    ).resolves.toBeUndefined();
  });

  it('releases a cancelled appointment range for reuse', async () => {
    const rows: Array<{ id: string }> = await db().query(
      `INSERT INTO appointments (patient_id, doctor_id, starts_at, ends_at, status)
       VALUES ($1, $2, $3, $4, 'CONFIRMED') RETURNING id`,
      [patientId, doctorId, startsAt, endsAt],
    );
    await db().query(`UPDATE appointments SET status = 'CANCELLED' WHERE id = $1`, [rows[0].id]);

    await expect(
      insertAppointment(secondPatientId, doctorId, startsAt, endsAt),
    ).resolves.toBeUndefined();
  });
});
