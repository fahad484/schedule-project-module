import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from '../availability/availability.module';
import { AuthModule } from '../auth/auth.module';
import { Appointment, Doctor, Patient } from '../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, Doctor]),
    AuthModule,
    AvailabilityModule,
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
