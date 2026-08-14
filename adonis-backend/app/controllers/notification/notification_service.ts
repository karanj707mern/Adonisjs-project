import { injectable, inject } from '@adonisjs/fold';
import {
  Prisma,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as amqplib from 'amqplib';
import env from '@adonisjs/core/services/env';
import logger from '@adonisjs/core/services/logger';
import BullMqService from './notification_queue';
import { sanitizeHtml } from '#lib/sanitize';

export interface QueueNotificationInput {
  userId?: number | null;
  orderId?: number | null;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string | null | undefined;
  subject?: string | null;
  body?: string;
  payload?: Prisma.InputJsonValue;
  skipPreferenceCheck?: boolean;
}

@injectable()
export default class NotificationService {
  private readonly transporter: nodemailer.Transporter | null;
  private readonly emailFrom: string;
  private readonly maxAttempts: number;
  private readonly retryIntervalMs: number;
  private retryTimer?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    private bullMq: BullMqService,
  ) {
    const host = env.get('SMTP_HOST') || '';
    this.emailFrom = env.get('EMAIL_FROM') || '';
    this.maxAttempts = env.get('NOTIFICATION_MAX_ATTEMPTS') || 3;
    this.retryIntervalMs = env.get('NOTIFICATION_RETRY_INTERVAL_MS') || 60000;

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(env.get('SMTP_PORT') || 587),
          secure: String(env.get('SMTP_SECURE') || 'false') === 'true',
          auth: {
            user: env.get('SMTP_USER') || '',
            pass: env.get('SMTP_PASS') || '',
          },
        })
      : null;
  }

  startProcessing() {
    if (this.bullMq.isConfigured) {
      this.bullMq.setHandler((id) => this.dispatchNotification(id));
      return;
    }

    setTimeout(() => void this.processPendingNotifications(), 15000);
    this.retryTimer = setInterval(
      () => void this.processPendingNotifications(),
      this.retryIntervalMs,
    );
  }

  async queue(input: QueueNotificationInput) {
    let subject = input.subject?.trim();
    let body = input.body;

    const recipient = input.recipient?.trim();
    if (!recipient) return null;

    if (input.userId && !input.skipPreferenceCheck) {
      const preference = await this.prisma.notificationPreference.findFirst({
        where: {
          userId: input.userId,
          type: input.type,
          channel: input.channel,
          enabled: false,
        },
      });
      if (preference) {
        logger.debug(
          `Notification ${input.type} via ${input.channel} skipped for user ${input.userId}`,
        );
        return null;
      }
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId ?? null,
        orderId: input.orderId ?? null,
        type: input.type,
        channel: input.channel,
        recipient,
        subject: subject || null,
        body: body || '',
        payload: input.payload ?? Prisma.JsonNull,
        maxAttempts: this.maxAttempts,
      },
    });

    if (this.bullMq.isConfigured) {
      void this.bullMq
        .addJob(notification.id)
        .catch((error) =>
          logger.error(
            `Notification ${notification.id} BullMQ add failed`,
            error instanceof Error ? error.stack : String(error),
          ),
        );
    } else {
      void this.dispatchNotification(notification.id).catch((error) =>
        logger.error(
          `Notification ${notification.id} dispatch failed`,
          error instanceof Error ? error.stack : String(error),
        ),
      );
    }

    return notification;
  }

  async queueMany(inputs: QueueNotificationInput[]) {
    return Promise.all(inputs.map((input) => this.queue(input)));
  }

  async getUserNotifications(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data, meta: { total, page, pages: Math.ceil(total / limit) } };
  }

  async markNotificationAsRead(notificationId: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId)
      throw new Error('Notification not found');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.SENT },
    });
  }

  async markAllNotificationsAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: { not: NotificationStatus.SENT } },
      data: { status: NotificationStatus.SENT },
    });
    return { count: result.count };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, status: { not: NotificationStatus.SENT } },
    });
    return { count };
  }

  async updateNotificationPreference(
    userId: number,
    dto: {
      type: NotificationType;
      channel: NotificationChannel;
      enabled: boolean;
    },
  ) {
    await this.prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: { userId, type: dto.type, channel: dto.channel },
      },
      update: { enabled: dto.enabled },
      create: {
        userId,
        type: dto.type,
        channel: dto.channel,
        enabled: dto.enabled,
      },
    });
  }

  async getUserPreferences(userId: number) {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: 'asc', channel: 'asc' },
    });
    return preferences.map((p) => ({
      type: p.type,
      channel: p.channel,
      enabled: p.enabled,
    }));
  }

  async findAdminNotifications(input: {
    orderId?: number;
    status?: NotificationStatus;
    channel?: NotificationChannel;
    type?: NotificationType;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = {};
    if (input.orderId !== undefined) where.orderId = input.orderId;
    if (input.status) where.status = input.status;
    if (input.channel) where.channel = input.channel;
    if (input.type) where.type = input.type;
    const skip = (input.page - 1) * input.limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return {
      data,
      meta: {
        total,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(total / input.limit),
      },
    };
  }

  async processPendingNotifications() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const pending = await this.prisma.notification.findMany({
        where: {
          status: {
            in: [NotificationStatus.PENDING, NotificationStatus.FAILED],
          },
          attempts: { lt: this.maxAttempts },
          scheduledAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: 25,
      });
      for (const notification of pending) {
        try {
          await this.dispatchNotification(notification.id);
        } catch (error) {
          logger.error(
            `Failed dispatching notification ${notification.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      logger.error(
        'Failed to process notifications',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async dispatchNotification(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (
      !notification ||
      notification.status === NotificationStatus.SENT ||
      notification.attempts >= notification.maxAttempts
    )
      return;

    try {
      const providerMessageId = await this.sendNotification({
        channel: notification.channel,
        recipient: notification.recipient!,
        subject: notification.subject || 'Moringa Store update',
        body: notification.body,
      });
      await this.prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.SENT,
          attempts: { increment: 1 },
          providerMessageId,
          lastError: null,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      const attempts = notification.attempts + 1;
      const failedPermanently = attempts >= notification.maxAttempts;
      const nextDelayMs = Math.min(1000 * 60 * 15, 1000 * 30 * attempts);
      await this.prisma.notification.update({
        where: { id },
        data: {
          status: failedPermanently
            ? NotificationStatus.FAILED
            : NotificationStatus.PENDING,
          attempts,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          scheduledAt: failedPermanently
            ? notification.scheduledAt
            : new Date(Date.now() + nextDelayMs),
        },
      });
    }
  }

  private async sendNotification(notification: {
    channel: NotificationChannel;
    recipient: string;
    subject: string;
    body: string;
  }): Promise<string | null> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        return this.sendEmail(
          notification.recipient,
          notification.subject,
          notification.body,
        );
      case NotificationChannel.SMS:
        return this.sendSms(notification.recipient, notification.body);
      case NotificationChannel.WHATSAPP:
        return this.sendWhatsapp(notification.recipient, notification.body);
      default:
        throw new Error('Unsupported notification channel');
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) throw new Error('SMTP transport is not configured');
    const result = (await this.transporter.sendMail({
      from: this.emailFrom,
      to,
      subject,
      html,
      text: html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''),
    })) as { messageId?: string };
    return typeof result.messageId === 'string' ? result.messageId : null;
  }

  private async sendSms(to: string, body: string) {
    const accountSid = env.get('TWILIO_ACCOUNT_SID') || '';
    const authToken = env.get('TWILIO_AUTH_TOKEN') || '';
    const from = env.get('TWILIO_SMS_FROM') || '';
    if (!accountSid || !authToken || !from)
      throw new Error('Twilio SMS is not configured');
    return this.sendTwilioMessage(accountSid, authToken, from, to, body);
  }

  private async sendWhatsapp(to: string, body: string) {
    const twilioWhatsappFrom = env.get('TWILIO_WHATSAPP_FROM') || '';
    const accountSid = env.get('TWILIO_ACCOUNT_SID') || '';
    const authToken = env.get('TWILIO_AUTH_TOKEN') || '';
    if (accountSid && authToken && twilioWhatsappFrom) {
      return this.sendTwilioMessage(
        accountSid,
        authToken,
        twilioWhatsappFrom,
        `whatsapp:${to}`,
        body,
      );
    }
    return this.sendWhatsappCloudMessage(to, body);
  }

  private async sendTwilioMessage(
    accountSid: string,
    authToken: string,
    from: string,
    to: string,
    body: string,
  ) {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };
    if (!response.ok)
      throw new Error(payload.message || 'Twilio notification failed');
    return payload.sid ?? null;
  }

  private async sendWhatsappCloudMessage(to: string, body: string) {
    const accessToken = env.get('WHATSAPP_ACCESS_TOKEN') || '';
    const phoneNumberId = env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    if (!accessToken || !phoneNumberId)
      throw new Error('WhatsApp provider is not configured');
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/^\+/, ''),
          type: 'text',
          text: { preview_url: false, body },
        }),
      },
    );
    const payload = (await response.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };
    if (!response.ok)
      throw new Error(payload.error?.message || 'WhatsApp notification failed');
    return payload.messages?.[0]?.id ?? null;
  }

  getHealth() {
    return { rabbitMq: false, bullMq: this.bullMq.isConfigured };
  }
}
