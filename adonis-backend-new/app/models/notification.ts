import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import { DateTime } from 'luxon';
import { NotificationChannel } from '@prisma/client';

export { NotificationChannel };

export enum NotificationType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  LOGIN_ALERT = 'LOGIN_ALERT',
  ORDER_PLACED = 'ORDER_PLACED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  WELCOME = 'WELCOME',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ADDRESS_ADDED = 'ADDRESS_ADDED',
  ADDRESS_UPDATED = 'ADDRESS_UPDATED',
  ADDRESS_DELETED = 'ADDRESS_DELETED',
  REVIEW_POSTED = 'REVIEW_POSTED',
  COMMENT_POSTED = 'COMMENT_POSTED',
  BLOG_POSTED = 'BLOG_POSTED',
  BLOG_UPDATED = 'BLOG_UPDATED',
  BLOG_DELETED = 'BLOG_DELETED',
  SUPPORT_ISSUE_CREATED = 'SUPPORT_ISSUE_CREATED',
  SUPPORT_ISSUE_UPDATED = 'SUPPORT_ISSUE_UPDATED',
  NEW_USER_REGISTERED = 'NEW_USER_REGISTERED',
  LOW_STOCK = 'LOW_STOCK',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare userId: number | null;

  @column()
  declare orderId: number | null;

  @column()
  declare type: NotificationType;

  @column()
  declare channel: NotificationChannel;

  @column()
  declare recipient: string;

  @column()
  declare subject: string | null;

  @column()
  declare body: string;

  @column()
  declare payload: unknown;

  @column()
  declare status: NotificationStatus;

  @column()
  declare attempts: number;

  @column()
  declare maxAttempts: number;

  @column()
  declare lastError: string | null;

  @column()
  declare providerMessageId: string | null;

  @column.dateTime()
  declare scheduledAt: DateTime;

  @column.dateTime()
  declare sentAt: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => User)
  declare user: any;

  @belongsTo(() => Order)
  declare order: any;
}
