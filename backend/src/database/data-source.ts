import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Appointment, Availability, Doctor, Notification, Patient, User } from './entities';
import { CreateAppointmentSchema1793068800000 } from './migrations/1793068800000-CreateAppointmentSchema';

// Load local credentials for both app startup and the TypeORM migration CLI.
if (existsSync('.env')) process.loadEnvFile();

export function createDatabaseOptions(databaseUrl = process.env.DATABASE_URL): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [User, Patient, Doctor, Availability, Appointment, Notification],
    migrations: [CreateAppointmentSchema1793068800000],
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'all',
    ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

const dataSource = new DataSource(createDatabaseOptions());
export default dataSource;
