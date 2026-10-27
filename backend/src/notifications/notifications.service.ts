import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Notification, NotificationChannel, NotificationStatus } from '../database/entities';

@Injectable()
export class NotificationsService {
  async enqueueAppointmentEvent(
    manager: EntityManager,
    appointmentId: string,
    recipientUserId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await manager.save(manager.create(Notification, {
      appointmentId,
      recipientUserId,
      eventType,
      channel: NotificationChannel.IN_APP,
      status: NotificationStatus.QUEUED,
      payload,
    }));
  }
}
