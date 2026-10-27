import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseOptions } from './data-source';

// Local development and the existing starter tests may run without PostgreSQL.
// Production requires an explicit database URL and fails during bootstrap if it is absent.
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured in production.');
}

const databaseModules = process.env.DATABASE_URL
  ? [TypeOrmModule.forRoot(createDatabaseOptions())]
  : [];

@Module({
  imports: databaseModules,
})
export class DatabaseModule {}
