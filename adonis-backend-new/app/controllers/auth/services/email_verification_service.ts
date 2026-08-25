/**
 * Email Verification Service — AdonisJS v7
 *
 * Sends transactional emails via nodemailer using SMTP config from config/app.ts.
 * Ported from Moringa-Backend (NestJS) — implements core flows:
 * - Email verification
 * - Password reset
 * - Login alert
 *
 * Other notification types (welcome, profile updated, etc.) are stubbed but
 * retain the correct interface for future BullMQ/Handlebars integration.
 */
import { inject } from '@adonisjs/fold';
import env from '#start/env';
import nodemailer from 'nodemailer';
import logger from '@adonisjs/core/services/logger';

@inject()
export default class EmailVerificationService {
  private readonly isProduction: boolean;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.isProduction = env.get('NODE_ENV') === 'production';
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter | null {
    const host = env.get('SMTP_HOST', '');
    const port = Number.parseInt(env.get('SMTP_PORT', '587'), 10);
    const user = env.get('SMTP_USER', '');
    const pass = env.get('SMTP_PASS', '');

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: env.get('SMTP_SECURE', false),
      auth: { user, pass },
    });
  }

  get isEmailConfigured(): boolean {
    return this.transporter !== null;
  }

  private getFrontendUrl(): string {
    const configuredUrl = env.get('FRONTEND_URL', '');
    const normalizedUrl = configuredUrl.trim().split(/[,\s]+/)[0] ?? '';

    if (!normalizedUrl) {
      return '';
    }

    try {
      return new URL(normalizedUrl).toString();
    } catch {
      logger.warn(
        `Invalid FRONTEND_URL configuration "${configuredUrl}". Falling back to relative auth URL.`,
      );
      return '';
    }
  }

  private buildAuthUrl(
    mode: 'verify-email' | 'reset-password',
    token: string,
  ): string {
    const frontendUrl = this.getFrontendUrl();
    if (!frontendUrl) {
      return `/auth?mode=${mode}&token=${encodeURIComponent(token)}`;
    }

    const authUrl = new URL('/auth', frontendUrl);
    authUrl.searchParams.set('mode', mode);
    authUrl.searchParams.set('token', token);
    return authUrl.toString();
  }

  buildVerificationUrl(token: string): string {
    return this.buildAuthUrl('verify-email', token);
  }

  buildPasswordResetUrl(token: string): string {
    return this.buildAuthUrl('reset-password', token);
  }

  private get fromAddress(): string {
    return env.get('EMAIL_FROM', env.get('SMTP_USER', 'no-reply@example.com'));
  }

  private formatLocation(deviceInfo?: {
    city?: string;
    region?: string;
    country?: string;
    timezone?: string;
  }): string {
    const parts = [
      deviceInfo?.city,
      deviceInfo?.region,
      deviceInfo?.country,
    ].filter(Boolean);

    if (parts.length) {
      return parts.join(', ');
    }

    if (deviceInfo?.timezone) {
      return deviceInfo.timezone;
    }

    return 'Unknown location';
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    name?: string,
    _userId?: number,
  ): Promise<string> {
    const verificationUrl = this.buildVerificationUrl(token);

    if (!this.isEmailConfigured) {
      // Never log token-bearing URLs in production (secret leakage).
      if (!this.isProduction) {
        logger.warn(
          `SMTP not configured. Verification link for ${email}: ${verificationUrl}`,
        );
      } else {
        logger.error(
          { email },
          'SMTP not configured in production — verification email NOT sent',
        );
      }
      return verificationUrl;
    }

    try {
      await this.transporter!.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Verify your email — Moringa Store',
        html: `<h1>Welcome to Moringa Store!</h1>
<p>Hello ${name || 'User'},</p>
<p>Please verify your email address by clicking the link below:</p>
<p><a href="${verificationUrl}" style="padding:10px 20px;background:#166534;color:white;text-decoration:none;border-radius:5px;">Verify Email</a></p>
<p>Or copy this link: ${verificationUrl}</p>
<p>This link expires in 24 hours.</p>`,
        text: `Welcome to Moringa Store! Verify your email: ${verificationUrl}`,
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(
        { err: error },
        `Failed to send verification email to ${email}`,
      );
      throw new Error('Email service is unavailable. Please try again later.');
    }

    return verificationUrl;
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string,
    _userId?: number,
  ): Promise<string> {
    const resetUrl = this.buildPasswordResetUrl(token);

    if (!this.isEmailConfigured) {
      if (!this.isProduction) {
        logger.warn(
          `SMTP not configured. Password reset link for ${email}: ${resetUrl}`,
        );
      } else {
        logger.error(
          { email },
          'SMTP not configured in production — password reset email NOT sent',
        );
      }
      return resetUrl;
    }

    try {
      await this.transporter!.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Reset your password — Moringa Store',
        html: `<h1>Password Reset</h1>
<p>Hello ${name || 'User'},</p>
<p>Click the link below to reset your password:</p>
<p><a href="${resetUrl}" style="padding:10px 20px;background:#166534;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p>
<p>Or copy this link: ${resetUrl}</p>
<p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
        text: `Reset your password: ${resetUrl}`,
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(
        { err: error },
        `Failed to send password reset email to ${email}`,
      );
      throw new Error('Email service is unavailable. Please try again later.');
    }

    return resetUrl;
  }

  async sendLoginAlert(
    email: string,
    name: string,
    _userId?: number,
    deviceInfo?: {
      browser?: string;
      os?: string;
      device?: string;
      ip?: string;
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    },
  ): Promise<boolean> {
    if (!this.isEmailConfigured) {
      logger.warn(`SMTP not configured. Login alert for ${email}`);
      return false;
    }

    const browser = deviceInfo?.browser || 'Unknown browser';
    const os = deviceInfo?.os || 'Unknown OS';
    const device = deviceInfo?.device || 'Unknown device';
    const ip = deviceInfo?.ip || 'Unknown IP';
    const location = this.formatLocation(deviceInfo);

    try {
      await this.transporter!.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'New login to your Moringa Store account',
        html: `<h1>New Login Detected</h1>
<p>Hello ${name},</p>
<p>We detected a new login to your account:</p>
<ul>
  <li><strong>Browser:</strong> ${browser}</li>
  <li><strong>OS:</strong> ${os}</li>
  <li><strong>Device:</strong> ${device}</li>
  <li><strong>IP:</strong> ${ip}</li>
  <li><strong>Location:</strong> ${location}</li>
  <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
</ul>
<p>If this was you, no action needed. If not, please reset your password immediately.</p>`,
        text: `New login to your account from ${browser} on ${os} (${ip}) at ${location}`,
      });
      logger.info(`Login alert email sent to ${email}`);
    } catch (error) {
      logger.error({ err: error }, `Failed to send login alert to ${email}`);
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Stub methods — retain interface for future BullMQ/Handlebars integration
  // ---------------------------------------------------------------------------

  async sendWelcome(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendEmailVerified(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendProfileUpdated(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressAdded(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressUpdated(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressDeleted(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendReviewPosted(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendCommentPosted(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogPosted(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogUpdated(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogDeleted(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendNewUserRegistered(
    _email: string,
    _name: string,
    _userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendLowStock(
    _email: string,
    _name: string,
    _userId?: number,
    _productName?: string,
  ): Promise<null> {
    return null;
  }

  async sendSupportIssueCreated(
    _email: string,
    _name: string,
    _userId?: number,
    _issueTitle?: string,
  ): Promise<null> {
    return null;
  }

  async sendSupportIssueUpdated(
    _email: string,
    _name: string,
    _userId?: number,
    _issueTitle?: string,
  ): Promise<null> {
    return null;
  }
}
