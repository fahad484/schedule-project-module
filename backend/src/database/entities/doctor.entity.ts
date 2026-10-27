import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Availability } from './availability.entity';
import { User } from './user.entity';

@Entity({ name: 'doctors' })
@Check('doctors_consultation_fee_ck', '"consultation_fee_cents" >= 0')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, (user) => user.doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'doctors_user_id_fk' })
  user!: User;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  @Column({ type: 'varchar', length: 120 })
  specialty!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'license_number', type: 'varchar', length: 120, nullable: true, unique: true })
  licenseNumber!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ name: 'consultation_fee_cents', type: 'integer', default: 0 })
  consultationFeeCents!: number;

  @Column({ name: 'time_zone', type: 'varchar', length: 64, default: 'UTC' })
  timeZone!: string;

  @OneToMany(() => Availability, (availability) => availability.doctor)
  availabilities?: Availability[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
