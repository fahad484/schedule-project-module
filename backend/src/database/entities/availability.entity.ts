import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity({ name: 'availabilities' })
@Index('availabilities_doctor_weekday_idx', ['doctorId', 'weekday'])
@Check('availabilities_weekday_ck', '"weekday" BETWEEN 1 AND 7')
@Check('availabilities_time_range_ck', '"local_end" > "local_start"')
@Check('availabilities_slot_minutes_ck', '"slot_minutes" BETWEEN 5 AND 240')
@Check('availabilities_valid_dates_ck', '"valid_until" IS NULL OR "valid_until" >= "valid_from"')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'doctor_id', type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id', foreignKeyConstraintName: 'availabilities_doctor_id_fk' })
  doctor!: Doctor;

  /** ISO weekday: Monday=1 through Sunday=7. */
  @Column({ type: 'smallint' })
  weekday!: number;

  @Column({ name: 'local_start', type: 'time' })
  localStart!: string;

  @Column({ name: 'local_end', type: 'time' })
  localEnd!: string;

  @Column({ name: 'slot_minutes', type: 'smallint' })
  slotMinutes!: number;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom!: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
