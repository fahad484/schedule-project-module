import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentStatus } from './enums';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity({ name: 'appointments' })
@Check('appointments_positive_duration_ck', '"ends_at" > "starts_at"')
@Index('appointments_patient_start_idx', ['patientId', 'startsAt'])
@Index('appointments_doctor_start_idx', ['doctorId', 'startsAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id', foreignKeyConstraintName: 'appointments_patient_id_fk' })
  patient!: Patient;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id', foreignKeyConstraintName: 'appointments_doctor_id_fk' })
  doctor!: Doctor;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'enum', enum: AppointmentStatus, enumName: 'appointment_status_enum', default: AppointmentStatus.CONFIRMED })
  status!: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
