import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus, Availability, Doctor } from '../database/entities';
import { AvailabilityInput } from './availability.schemas';

export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability) private readonly availabilities: Repository<Availability>,
    @InjectRepository(Doctor) private readonly doctors: Repository<Doctor>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
  ) {}

  async listForDoctor(doctorId: string, date: string): Promise<AvailableSlot[]> {
    const doctor = await this.doctors.findOneBy({ id: doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const localDay = DateTime.fromISO(date, { zone: doctor.timeZone });
    if (!localDay.isValid || localDay.toISODate() !== date) {
      throw new ConflictException('The requested date or doctor time zone is invalid.');
    }
    if (localDay.toMillis() < DateTime.now().setZone(doctor.timeZone).startOf('day').toMillis()) {
      return [];
    }

    const rules = await this.availabilities.createQueryBuilder('availability')
      .where('availability.doctorId = :doctorId', { doctorId })
      .andWhere('availability.weekday = :weekday', { weekday: localDay.weekday })
      .andWhere('availability.isActive = true')
      .andWhere('availability.validFrom <= :date', { date })
      .andWhere('(availability.validUntil IS NULL OR availability.validUntil >= :date)', { date })
      .getMany();

    const candidateSlots = rules.flatMap((rule) => this.slotsForRule(rule, date, doctor.timeZone));
    if (candidateSlots.length === 0) return [];

    const starts = candidateSlots.map((slot) => Date.parse(slot.startsAt));
    const ends = candidateSlots.map((slot) => Date.parse(slot.endsAt));
    const busy = await this.appointments.createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .andWhere('appointment.startsAt < :rangeEnd', { rangeEnd: new Date(Math.max(...ends)) })
      .andWhere('appointment.endsAt > :rangeStart', { rangeStart: new Date(Math.min(...starts)) })
      .getMany();

    return candidateSlots
      .filter((slot) => {
        const start = Date.parse(slot.startsAt);
        const end = Date.parse(slot.endsAt);
        return !busy.some((appointment) =>
          start < appointment.endsAt.getTime() && end > appointment.startsAt.getTime(),
        );
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async addForDoctor(userId: string, input: AvailabilityInput): Promise<Availability[]> {
    const doctor = await this.doctors.findOneBy({ userId });
    if (!doctor) throw new ForbiddenException('A doctor profile is required to manage availability.');

    const existing = await this.availabilities.findBy({ doctorId: doctor.id, isActive: true });
    const proposed = input.rules.map((rule) => ({ ...rule, validUntil: rule.validUntil ?? null }));
    const allRules = [...existing, ...proposed];

    for (let i = existing.length; i < allRules.length; i += 1) {
      const current = allRules[i];
      const start = this.minutes(current.localStart);
      const end = this.minutes(current.localEnd);
      if (end <= start) throw new ConflictException('An availability window must end after it starts.');
      for (let j = 0; j < i; j += 1) {
        const other = allRules[j];
        if (current.weekday !== other.weekday || !this.dateRangesOverlap(current, other)) continue;
        if (start < this.minutes(other.localEnd) && end > this.minutes(other.localStart)) {
          throw new ConflictException('Availability windows for the same weekday cannot overlap.');
        }
      }
    }

    const records = proposed.map((rule) => this.availabilities.create({
      doctorId: doctor.id,
      weekday: rule.weekday,
      localStart: `${rule.localStart}:00`,
      localEnd: `${rule.localEnd}:00`,
      slotMinutes: rule.slotMinutes,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      isActive: true,
    }));
    return this.availabilities.save(records);
  }

  async listMine(userId: string): Promise<Availability[]> {
    const doctor = await this.doctors.findOneBy({ userId });
    if (!doctor) throw new ForbiddenException('A doctor profile is required to view availability.');
    return this.availabilities.find({ where: { doctorId: doctor.id }, order: { weekday: 'ASC', localStart: 'ASC' } });
  }

  async requireBookableSlot(doctorId: string, startsAt: Date): Promise<AvailableSlot> {
    const local = DateTime.fromJSDate(startsAt, { zone: 'utc' });
    const doctor = await this.doctors.findOneBy({ id: doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found.');
    const localDate = local.setZone(doctor.timeZone).toISODate();
    if (!localDate) throw new ConflictException('The requested appointment time is invalid.');
    const slots = await this.listForDoctor(doctorId, localDate);
    const requestedStart = startsAt.getTime();
    const selected = slots.find((slot) => Date.parse(slot.startsAt) === requestedStart);
    if (!selected) throw new ConflictException('That appointment slot is no longer available. Refresh the schedule and choose another time.');
    return selected;
  }

  private slotsForRule(rule: Availability, date: string, zone: string): AvailableSlot[] {
    const start = DateTime.fromISO(`${date}T${rule.localStart}`, { zone });
    const end = DateTime.fromISO(`${date}T${rule.localEnd}`, { zone });
    if (!start.isValid || !end.isValid || end.toMillis() <= start.toMillis()) return [];

    const slots: AvailableSlot[] = [];
    for (
      let cursor = start;
      cursor.plus({ minutes: rule.slotMinutes }).toMillis() <= end.toMillis();
      cursor = cursor.plus({ minutes: rule.slotMinutes })
    ) {
      const slotEnd = cursor.plus({ minutes: rule.slotMinutes });
      if (cursor.toISO() && slotEnd.toISO()) {
        slots.push({ startsAt: cursor.toUTC().toISO()!, endsAt: slotEnd.toUTC().toISO()! });
      }
    }
    return slots;
  }

  private minutes(time: string): number {
    const [hours = '0', minutes = '0'] = time.split(':');
    return Number(hours) * 60 + Number(minutes);
  }

  private dateRangesOverlap(
    a: { validFrom: string; validUntil?: string | null },
    b: { validFrom: string; validUntil?: string | null },
  ): boolean {
    const aEnd = a.validUntil ?? '9999-12-31';
    const bEnd = b.validUntil ?? '9999-12-31';
    return a.validFrom <= bEnd && b.validFrom <= aEnd;
  }
}
