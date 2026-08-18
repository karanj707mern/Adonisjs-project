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
    orderId: vine.optional(vine.number()),
    status: vine.optional(vine.enum(Object.values(NotificationStatus))),
    channel: vine.optional(vine.enum(Object.values(NotificationChannel))),
    type: vine.optional(vine.enum(Object.values(NotificationType))),
    page: vine.optional(vine.number().min(1), 1),
    limit: vine.optional(vine.number().min(1).max(100), 20),
  }),
);
