import { injectable, inject } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import * as nodemailer from 'nodemailer'
import * as amqplib from 'amqplib'
import env from '@adonisjs/core/services/env'
import logger from '@adonisjs/core/services/logger'
import {
  NotificationChannel,
  NotificationType,
} from '#models/user'
import { NotificationStatus } from '#models/notification'
import BullMqService from './notification_queue'
import { sanitizeHtml } from '#lib/sanitize'

export interface QueueNotificationInput {
  userId?: number | null
  orderId?: number | null
  type: string
  channel: string
  recipient: string | null | undefined
  subject?: string | null
  body?: string
  payload?: unknown
  skipPreferenceCheck?: boolean
}

@injectable()
export default class NotificationService {
  private readonly transporter: any | null
  private readonly emailFrom: string
  private readonly maxAttempts: number
  private readonly retryIntervalMs: number
  private retryTimer?: NodeJS.Timeout
  private isProcessing = false

  constructor(
    private db: Database,
    private bullMq: BullMqService,
  ) {
    const host = env.get('SMTP_HOST') || ''
    this.emailFrom = env.get('EMAIL_FROM') || ''
    this.maxAttempts = env.get('NOTIFICATION_MAX_ATTEMPTS') || 3
    this.retryIntervalMs = env.get('NOTIFICATION_RETRY_INTERVAL_MS') || 60000

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
      : null
  }

  startProcessing() {
    if (this.bullMq.isConfigured) {
      this.bullMq.setHandler((id) => this.dispatchNotification(id))
      return
    }

    setTimeout(() => void this.processPendingNotifications(), 15000)
    this.retryTimer = setInterval(
      () => void this.processPendingNotifications(),
      this.retryIntervalMs,
    )
  }

  async queue(input: QueueNotificationInput) {
    let subject = input.subject?.trim()
    let body = input.body

    const recipient = input.recipient?.trim()
    if (!recipient) return null

    if (input.userId && !input.skipPreferenceCheck) {
      const preference = await this.db
        .table('notification_preferences')
        .where('user_id', input.userId)
        .andWhere('type', input.type)
        .andWhere('channel', input.channel)
        .andWhere('enabled', false)
        .first()

      if (preference) {
        logger.debug(
          `Notification ${input.type} via ${input.channel} skipped for user ${input.userId}`,
        )
        return null
      }
    }

    const insertId = await this.db.table('notifications').insert({
      user_id: input.userId ?? null,
      order_id: input.orderId ?? null,
      type: input.type,
      channel: input.channel,
      recipient,
      subject: subject || null,
      body: body || '',
      payload: input.payload ?? null,
      status: NotificationStatus.PENDING,
      attempts: 0,
      max_attempts: this.maxAttempts,
      scheduled_at: new Date(),
    })

    const [notification] = await this.db
      .table('notifications')
      .where('id', insertId[0])
      .first()

    if (this.bullMq.isConfigured) {
      void this.bullMq
        .addJob(notification.id)
        .catch((error) =>
          logger.error(
            `Notification ${notification.id} BullMQ add failed`,
            error instanceof Error ? error.stack : String(error),
          ),
        )
    } else {
      void this.dispatchNotification(notification.id).catch((error) =>
        logger.error(
          `Notification ${notification.id} dispatch failed`,
          error instanceof Error ? error.stack : String(error),
        ),
      )
    }

    return notification
  }

  async queueMany(inputs: QueueNotificationInput[]) {
    return Promise.all(inputs.map((input) => this.queue(input)))
  }

  async getUserNotifications(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.db
        .table('notifications')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .offset(skip)
        .limit(limit),
      this.db.table('notifications').where('user_id', userId).count('id as total'),
    ])
    return { data, meta: { total, page, pages: Math.ceil(total / limit) } }
  }

  async markNotificationAsRead(notificationId: number, userId: number) {
    const notification = await this.db
      .table('notifications')
      .where('id', notificationId)
      .first()

    if (!notification || notification.user_id !== userId)
      throw new Error('Notification not found')

    await this.db.table('notifications').where('id', notificationId).update({
      status: NotificationStatus.SENT,
    })

    const [updated] = await this.db
      .table('notifications')
      .where('id', notificationId)
      .first()

    return updated
  }

  async markAllNotificationsAsRead(userId: number) {
    const result = await this.db
      .table('notifications')
      .where('user_id', userId)
      .andWhere('status', '!=', NotificationStatus.SENT)
      .update({ status: NotificationStatus.SENT })

    return { count: result.length }
  }

  async getUnreadCount(userId: number) {
    const count = await this.db
      .table('notifications')
      .where('user_id', userId)
      .andWhere('status', '!=', NotificationStatus.SENT)
      .count('id as total')

    return { count: (count[0] as any).total || 0 }
  }

  async updateNotificationPreference(
    userId: number,
    dto: {
      type: string
      channel: string
      enabled: boolean
    },
  ) {
    const existing = await this.db
      .table('notification_preferences')
      .where('user_id', userId)
      .andWhere('type', dto.type)
      .andWhere('channel', dto.channel)
      .first()

    if (existing) {
      await this.db
        .table('notification_preferences')
        .where('id', existing.id)
        .update({ enabled: dto.enabled })
      return
    }

    await this.db.table('notification_preferences').insert({
      user_id: userId,
      type: dto.type,
      channel: dto.channel,
      enabled: dto.enabled,
    })
  }

  async getUserPreferences(userId: number) {
    const preferences = await this.db
      .table('notification_preferences')
      .where('user_id', userId)
      .orderBy('type', 'asc')
      .orderBy('channel', 'asc')

    return preferences.map((p: any) => ({
      type: p.type,
      channel: p.channel,
      enabled: p.enabled,
    }))
  }

  async findAdminNotifications(input: {
    orderId?: number
    status?: string
    channel?: string
    type?: string
    page: number
    limit: number
  }) {
    const where: Record<string, unknown> = {}
    if (input.orderId !== undefined) where.order_id = input.orderId
    if (input.status) where.status = input.status
    if (input.channel) where.channel = input.channel
    if (input.type) where.type = input.type
    const skip = (input.page - 1) * input.limit
    const [data, total] = await Promise.all([
      this.db
        .table('notifications')
        .where(where)
        .orderBy('created_at', 'desc')
        .offset(skip)
        .limit(input.limit),
      this.db.table('notifications').where(where).count('id as total'),
    ])
    return {
      data,
      meta: {
        total: (total as any)[0]?.total || 0,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(((total as any)[0]?.total || 0) / input.limit),
      },
    }
  }

  async processPendingNotifications() {
    if (this.isProcessing) return
    this.isProcessing = true
    try {
      const pending = await this.db
        .table('notifications')
        .where((qb) => {
          qb
            .where('status', NotificationStatus.PENDING)
            .orWhere('status', NotificationStatus.FAILED)
        })
        .andWhere('attempts', '<', this.maxAttempts)
        .andWhere('scheduled_at', '<=', new Date())
        .orderBy('created_at', 'asc')
        .limit(25)

      for (const notification of pending) {
        try {
          await this.dispatchNotification(notification.id)
        } catch (error) {
          logger.error(
            `Failed dispatching notification ${notification.id}`,
            error instanceof Error ? error.stack : String(error),
          )
        }
      }
    } catch (error) {
      logger.error(
        'Failed to process notifications',
        error instanceof Error ? error.stack : String(error),
      )
    } finally {
      this.isProcessing = false
    }
  }

  private async dispatchNotification(id: number) {
    const notification = await this.db
      .table('notifications')
      .where('id', id)
      .first()

    if (
      !notification ||
      notification.status === NotificationStatus.SENT ||
      notification.attempts >= notification.max_attempts
    )
      return

    try {
      const providerMessageId = await this.sendNotification({
        channel: notification.channel,
        recipient: notification.recipient!,
        subject: notification.subject || 'Moringa Store update',
        body: notification.body,
      })
      await this.db.table('notifications').where('id', id).update({
        status: NotificationStatus.SENT,
        attempts: (notification.attempts as number) + 1,
        provider_message_id: providerMessageId,
        last_error: null,
        sent_at: new Date(),
      })
    } catch (error) {
      const attempts = (notification.attempts as number) + 1
      const failedPermanently = attempts >= notification.max_attempts
      const nextDelayMs = Math.min(1000 * 60 * 15, 1000 * 30 * attempts)
      await this.db.table('notifications').where('id', id).update({
        status: failedPermanently
          ? NotificationStatus.FAILED
          : NotificationStatus.PENDING,
        attempts,
        last_error: error instanceof Error ? error.message : 'Unknown error',
        scheduled_at: failedPermanently
          ? notification.scheduled_at
          : new Date(Date.now() + nextDelayMs),
      })
    }
  }

  private async sendNotification(notification: {
    channel: string
    recipient: string
    subject: string
    body: string
  }): Promise<string | null> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        return this.sendEmail(
          notification.recipient,
          notification.subject,
          notification.body,
        )
      case NotificationChannel.SMS:
        return this.sendSms(notification.recipient, notification.body)
      case NotificationChannel.WHATSAPP:
        return this.sendWhatsapp(notification.recipient, notification.body)
      default:
        throw new Error('Unsupported notification channel')
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) throw new Error('SMTP transport is not configured')
    const result = (await this.transporter.sendMail({
      from: this.emailFrom,
      to,
      subject,
      html,
      text: html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''),
    })) as { messageId?: string }
    return typeof result.messageId === 'string' ? result.messageId : null
  }

  private async sendSms(to: string, body: string) {
    const accountSid = env.get('TWILIO_ACCOUNT_SID') || ''
    const authToken = env.get('TWILIO_AUTH_TOKEN') || ''
    const from = env.get('TWILIO_SMS_FROM') || ''
    if (!accountSid || !authToken || !from)
      throw new Error('Twilio SMS is not configured')
    return this.sendTwilioMessage(accountSid, authToken, from, to, body)
  }

  private async sendWhatsapp(to: string, body: string) {
    const twilioWhatsappFrom = env.get('TWILIO_WHATSAPP_FROM') || ''
    const accountSid = env.get('TWILIO_ACCOUNT_SID') || ''
    const authToken = env.get('TWILIO_AUTH_TOKEN') || ''
    if (accountSid && authToken && twilioWhatsappFrom) {
      return this.sendTwilioMessage(
        accountSid,
        authToken,
        twilioWhatsappFrom,
        `whatsapp:${to}`,
        body,
      )
    }
    return this.sendWhatsappCloudMessage(to, body)
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
    )
    const payload = (await response.json().catch(() => ({}))) as {
      sid?: string
      message?: string
    }
    if (!response.ok)
      throw new Error(payload.message || 'Twilio notification failed')
    return payload.sid ?? null
  }

  private async sendWhatsappCloudMessage(to: string, body: string) {
    const accessToken = env.get('WHATSAPP_ACCESS_TOKEN') || ''
    const phoneNumberId = env.get('WHATSAPP_PHONE_NUMBER_ID') || ''
    if (!accessToken || !phoneNumberId)
      throw new Error('WhatsApp provider is not configured')
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
    )
    const payload = (await response.json().catch(() => ({}))) as {
      messages?: { id?: string }[]
      error?: { message?: string }
    }
    if (!response.ok)
      throw new Error(payload.error?.message || 'WhatsApp notification failed')
    return payload.messages?.[0]?.id ?? null
  }

  getHealth() {
    return { rabbitMq: false, bullMq: this.bullMq.isConfigured }
  }
}
