import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../database/entities';

export interface DoctorCard {
  id: string;
  fullName: string;
  specialty: string;
  bio: string | null;
  consultationFeeCents: number;
  timeZone: string;
}

@Injectable()
export class DoctorsService {
  constructor(@InjectRepository(Doctor) private readonly doctors: Repository<Doctor>) {}

  async findAll(search?: string): Promise<DoctorCard[]> {
    const query = this.doctors.createQueryBuilder('doctor').orderBy('doctor.fullName', 'ASC').take(100);
    if (search?.trim()) {
      query.where('(LOWER(doctor.fullName) LIKE LOWER(:search) OR LOWER(doctor.specialty) LIKE LOWER(:search))', {
        search: `%${search.trim()}%`,
      });
    }
    const doctors = await query.getMany();
    return doctors.map((doctor) => this.toCard(doctor));
  }

  async findOne(id: string): Promise<DoctorCard> {
    const doctor = await this.doctors.findOneBy({ id });
    if (!doctor) throw new NotFoundException('Doctor not found.');
    return this.toCard(doctor);
  }

  private toCard(doctor: Doctor): DoctorCard {
    return {
      id: doctor.id,
      fullName: doctor.fullName,
      specialty: doctor.specialty,
      bio: doctor.bio,
      consultationFeeCents: doctor.consultationFeeCents,
      timeZone: doctor.timeZone,
    };
  }
}
