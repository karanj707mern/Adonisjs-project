import env from '#start/env'
import logger from '#start/logger'

export default class EmailVerificationService {
  private readonly isProduction: boolean

  constructor() {
    this.isProduction = env.get('NODE_ENV') === 'production'
  }

  private getFrontendUrl(): string {
    const configuredUrl = env.get('FRONTEND_URL', '')
    const normalizedUrl = configuredUrl.split(/[,\s]+/)[0] ?? ''

    if (!normalizedUrl) {
      return ''
    }

    try {
      return new URL(normalizedUrl).toString()
    } catch {
      logger.warn(
        `Invalid FRONTEND_URL configuration "${configuredUrl}". Falling back to a relative auth URL.`
      )
      return ''
    }
  }

  private buildAuthUrl(mode: 'verify-email' | 'reset-password', token: string): string {
    const frontendUrl = this.getFrontendUrl()
    if (!frontendUrl) {
      return `/auth?mode=${mode}&token=${encodeURIComponent(token)}`
    }

    const authUrl = new URL('/auth', frontendUrl)
    authUrl.searchParams.set('mode', mode)
    authUrl.searchParams.set('token', token)
    return authUrl.toString()
  }

  buildVerificationUrl(token: string): string {
    return this.buildAuthUrl('verify-email', token)
  }

  buildPasswordResetUrl(token: string): string {
    return this.buildAuthUrl('reset-password', token)
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    _name?: string,
    _userId?: number
  ): Promise<string> {
    const verificationUrl = this.buildVerificationUrl(token)

    if (this.isProduction) {
      logger.warn(
        `SMTP transport is not configured. Verification link for ${email}: ${verificationUrl}`
      )
    } else {
      logger.warn(
        `SMTP transport is not configured. Verification link for ${email}: ${verificationUrl}`
      )
    }

    return verificationUrl
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    _name?: string,
    _userId?: number
  ): Promise<string> {
    const resetUrl = this.buildPasswordResetUrl(token)

    if (this.isProduction) {
      logger.warn(`SMTP transport is not configured. Password reset link for ${email}: ${resetUrl}`)
    } else {
      logger.warn(`SMTP transport is not configured. Password reset link for ${email}: ${resetUrl}`)
    }

    return resetUrl
  }

  async sendLoginAlert(
    email: string,
    _name: string,
    _userId?: number,
    _deviceInfo?: {
      browser?: string
      os?: string
      device?: string
      ip?: string
      country?: string
      region?: string
      city?: string
      timezone?: string
    }
  ): Promise<null> {
    if (this.isProduction) {
      logger.warn(`SMTP transport is not configured. Login alert for ${email}`)
    } else {
      logger.warn(`SMTP transport is not configured. Login alert for ${email}`)
    }

    return null
  }

  async sendWelcome(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendEmailVerified(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendProfileUpdated(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendAddressAdded(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendAddressUpdated(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendAddressDeleted(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendReviewPosted(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendCommentPosted(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendBlogPosted(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendBlogUpdated(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendBlogDeleted(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendNewUserRegistered(_email: string, _name: string, _userId?: number): Promise<null> {
    return null
  }

  async sendLowStock(
    _email: string,
    _name: string,
    _userId?: number,
    _productName?: string
  ): Promise<null> {
    return null
  }

  async sendSupportIssueCreated(
    _email: string,
    _name: string,
    _userId?: number,
    _issueTitle?: string
  ): Promise<null> {
    return null
  }

  async sendSupportIssueUpdated(
    _email: string,
    _name: string,
    _userId?: number,
    _issueTitle?: string
  ): Promise<null> {
    return null
  }
}
