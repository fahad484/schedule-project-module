import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, UserRole } from '../database/entities';

@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private readonly patients: Repository<Patient>) {}

  async findMine(userId: string, role: UserRole) {
    if (role !== UserRole.PATIENT) throw new ForbiddenException('Patient access is required.');
    const patient = await this.patients.findOneBy({ userId });
    if (!patient) throw new NotFoundException('Patient profile not found.');
    return patient;
  }
}
