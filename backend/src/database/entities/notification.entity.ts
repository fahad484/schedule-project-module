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
import { Appointment } from './appointment.entity';
import { User } from './user.entity';
import { NotificationChannel, NotificationStatus } from './enums';

@Entity({ name: 'notifications' })
@Check('notifications_attempt_count_ck', '"attempt_count" >= 0')
@Index('notifications_delivery_queue_idx', ['status', 'availableAt'])
@Index('notifications_appointment_idx', ['appointmentId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => Appointment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'appointment_id', foreignKeyConstraintName: 'notifications_appointment_id_fk' })
  appointment!: Appointment;

  @Column({ name: 'recipient_user_id', type: 'uuid' })
  recipientUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipient_user_id', foreignKeyConstraintName: 'notifications_recipient_user_id_fk' })
  recipient!: User;

  @Column({ name: 'event_type', type: 'varchar', length: 80 })
  eventType!: string;

  @Column({ type: 'enum', enum: NotificationChannel, enumName: 'notification_channel_enum' })
  channel!: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationStatus, enumName: 'notification_status_enum', default: NotificationStatus.QUEUED })
  status!: NotificationStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount!: number;

  @Column({ name: 'available_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  availableAt!: Date;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
