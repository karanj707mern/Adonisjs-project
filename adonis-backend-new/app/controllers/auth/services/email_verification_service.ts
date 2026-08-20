import env from '#start/env';

export default class EmailVerificationService {
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = env.get('NODE_ENV') === 'production';
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
      console.warn(
        `Invalid FRONTEND_URL configuration "${configuredUrl}". Falling back to a relative auth URL.`,
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

  async sendVerificationEmail(
    email: string,
    token: string,
    name?: string,
    userId?: number,
  ): Promise<string> {
    const verificationUrl = this.buildVerificationUrl(token);

    if (this.isProduction) {
      console.warn(
        `SMTP transport is not configured. Verification link for ${email}: ${verificationUrl}`,
      );
    } else {
      console.warn(
        `SMTP transport is not configured. Verification link for ${email}: ${verificationUrl}`,
      );
    }

    return verificationUrl;
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    name?: string,
    userId?: number,
  ): Promise<string> {
    const resetUrl = this.buildPasswordResetUrl(token);

    if (this.isProduction) {
      console.warn(
        `SMTP transport is not configured. Password reset link for ${email}: ${resetUrl}`,
      );
    } else {
      console.warn(
        `SMTP transport is not configured. Password reset link for ${email}: ${resetUrl}`,
      );
    }

    return resetUrl;
  }

  async sendLoginAlert(
    email: string,
    name: string,
    userId?: number,
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
  ): Promise<null> {
    if (this.isProduction) {
      console.warn(
        `SMTP transport is not configured. Login alert for ${email}`,
      );
    } else {
      console.warn(
        `SMTP transport is not configured. Login alert for ${email}`,
      );
    }

    return null;
  }

  async sendWelcome(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendEmailVerified(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendProfileUpdated(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressAdded(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressUpdated(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendAddressDeleted(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendReviewPosted(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendCommentPosted(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogPosted(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogUpdated(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendBlogDeleted(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendNewUserRegistered(
    email: string,
    name: string,
    userId?: number,
  ): Promise<null> {
    return null;
  }

  async sendLowStock(
    email: string,
    name: string,
    userId?: number,
    productName?: string,
  ): Promise<null> {
    return null;
  }

  async sendSupportIssueCreated(
    email: string,
    name: string,
    userId?: number,
    issueTitle?: string,
  ): Promise<null> {
    return null;
  }

  async sendSupportIssueUpdated(
    email: string,
    name: string,
    userId?: number,
    issueTitle?: string,
  ): Promise<null> {
    return null;
  }
}
