import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/authenticated-user';
import {
  Appointment,
  AppointmentStatus,
  Doctor,
  Patient,
  UserRole,
} from '../database/entities';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './appointments.schemas';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(Patient) private readonly patients: Repository<Patient>,
    @InjectRepository(Doctor) private readonly doctors: Repository<Doctor>,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  async book(user: AuthenticatedUser, input: CreateAppointmentDto) {
    if (user.role !== UserRole.PATIENT) throw new ForbiddenException('Only patients can book appointments.');
    const patient = await this.patients.findOneBy({ userId: user.sub });
    if (!patient) throw new ForbiddenException('A patient profile is required to book an appointment.');

    const startsAt = new Date(input.startsAt);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Choose a future appointment time.');
    }
    const slot = await this.availability.requireBookableSlot(input.doctorId, startsAt);
    const doctor = await this.doctors.findOneBy({ id: input.doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    try {
      return await this.dataSource.transaction(async (manager) => {
        const appointment = await manager.save(manager.create(Appointment, {
          patientId: patient.id,
          doctorId: doctor.id,
          startsAt: new Date(slot.startsAt),
          endsAt: new Date(slot.endsAt),
          status: AppointmentStatus.CONFIRMED,
        }));
        await this.notifications.enqueueAppointmentEvent(
          manager,
          appointment.id,
          user.sub,
          'APPOINTMENT_CONFIRMED',
          { appointmentId: appointment.id, doctorName: doctor.fullName, startsAt: slot.startsAt },
        );
        await this.notifications.enqueueAppointmentEvent(
          manager,
          appointment.id,
          doctor.userId,
          'APPOINTMENT_BOOKED',
          { appointmentId: appointment.id, patientName: patient.fullName, startsAt: slot.startsAt },
        );
        return {
          id: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          doctor: { id: doctor.id, fullName: doctor.fullName, specialty: doctor.specialty },
        };
      });
    } catch (error) {
      const driverError = error instanceof QueryFailedError
        ? error.driverError as { code?: string; constraint?: string }
        : undefined;
      if (driverError?.code === '23P01' && driverError.constraint === 'appointments_doctor_active_time_excl') {
        throw new ConflictException('That slot was just booked. Please choose another available time.');
      }
      throw error;
    }
  }

  async findMine(user: AuthenticatedUser) {
    const query = this.appointments.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .orderBy('appointment.startsAt', 'DESC');

    if (user.role === UserRole.PATIENT) {
      query.innerJoin('patient.user', 'patientUser').andWhere('patientUser.id = :userId', { userId: user.sub });
    } else if (user.role === UserRole.DOCTOR) {
      query.innerJoin('doctor.user', 'doctorUser').andWhere('doctorUser.id = :userId', { userId: user.sub });
    } else {
      throw new ForbiddenException('This account cannot view appointment records.');
    }

    const results = await query.getMany();
    return results.map((appointment) => ({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      createdAt: appointment.createdAt,
      patient: { id: appointment.patient.id, fullName: appointment.patient.fullName },
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.fullName,
        specialty: appointment.doctor.specialty,
      },
    }));
  }

  async cancel(user: AuthenticatedUser, appointmentId: string) {
    return this.transition(user, appointmentId, AppointmentStatus.CANCELLED);
  }

  async complete(user: AuthenticatedUser, appointmentId: string) {
    if (user.role !== UserRole.DOCTOR) throw new ForbiddenException('Only the assigned doctor can complete an appointment.');
    return this.transition(user, appointmentId, AppointmentStatus.COMPLETED);
  }

  private async transition(user: AuthenticatedUser, appointmentId: string, next: AppointmentStatus) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.getRepository(Appointment).findOne({
        where: { id: appointmentId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!appointment) throw new NotFoundException('Appointment not found.');

      const patient = await manager.getRepository(Patient).findOneBy({ id: appointment.patientId });
      const doctor = await manager.getRepository(Doctor).findOneBy({ id: appointment.doctorId });
      const mayCancel = next === AppointmentStatus.CANCELLED && (
        (user.role === UserRole.PATIENT && patient?.userId === user.sub) ||
        (user.role === UserRole.DOCTOR && doctor?.userId === user.sub)
      );
      const mayComplete = next === AppointmentStatus.COMPLETED &&
        user.role === UserRole.DOCTOR && doctor?.userId === user.sub;
      if (!mayCancel && !mayComplete) throw new ForbiddenException('You cannot change this appointment.');
      if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
        throw new ConflictException('Only an active appointment can be changed.');
      }

      appointment.status = next;
      await manager.save(appointment);
      if (patient) {
        await this.notifications.enqueueAppointmentEvent(
          manager,
          appointment.id,
          patient.userId,
          next === AppointmentStatus.CANCELLED ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_COMPLETED',
          { appointmentId: appointment.id, status: next },
        );
      }
      return appointment;
    });
  }
}
