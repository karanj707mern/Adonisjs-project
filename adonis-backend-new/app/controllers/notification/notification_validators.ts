import vine from '@vinejs/vine';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';

export const notificationPreferenceValidator = vine.compile(
  vine.object({
    type: vine.enum(Object.values(NotificationType)),
    channel: vine.enum(Object.values(NotificationChannel)),
    enabled: vine.boolean(),
  }),
);

export const adminNotificationQueryValidator = vine.compile(
  vine.object({
    orderId: vine.number().optional(),
    status: vine.enum(Object.values(NotificationStatus)).optional(),
    channel: vine.enum(Object.values(NotificationChannel)).optional(),
    type: vine.enum(Object.values(NotificationType)).optional(),
    page: vine.number().optional(),
    limit: vine.number().min(1).max(100).optional(),
  }),
);
