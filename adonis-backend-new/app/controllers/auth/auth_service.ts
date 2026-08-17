import { inject, injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import env from '@adonisjs/core/services/env'
import {
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@adonisjs/core/http'

import DeviceInfoService from './services/device_info_service'
import EmailVerificationService from './services/email_verification_service'
import SessionService from './services/session_service'
import RedisCacheService from '#services/redis_cache_service'
import StorageService from '#services/storage_service'

export interface SafeUser {
  id: number
  name: string
  email: string
  role: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  avatar: string | null
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  addresses: {
    isDefault: boolean
    updatedAt: Date
  }[]
}

interface AuthResponse {
  message: string
  accessToken: string
  refreshToken: string
  user: SafeUser
}

const allowedImageMimeTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
}

@injectable()
export default class AuthService {
  constructor(
    private db: Database,
    private storage: StorageService,
    private cache: RedisCacheService,
    private deviceInfoService: DeviceInfoService,
    private emailVerificationService: EmailVerificationService,
    private sessionService: SessionService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    return { token, hashedToken }
  }

  private generatePasswordResetExpiry() {
    return new Date(Date.now() + 30 * 60 * 1000)
  }

  private generateEmailVerificationExpiry() {
    return new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

  private canSendVerificationEmail(user: {
    emailVerifyLastSentAt: Date | null
  }) {
    if (!user.emailVerifyLastSentAt) {
      return true
    }
    return user.emailVerifyLastSentAt.getTime() <= Date.now() - 2 * 60 * 1000
  }

  private async generateTokens(payload: {
    id: number
    email: string
    role: string
  }) {
    const secret = env.get('JWT_SECRET')
    const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' })
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' })
    return { accessToken, refreshToken }
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.db.table('sessions').where('user_id', userId).delete()
    await this.db.table('users').where('id', userId).update({
      refresh_token: null,
      refresh_token_expires_at: null,
    })

    return { message: 'Logged out successfully' }
  }

  async logoutByRefreshToken(
    refreshToken?: string,
  ): Promise<{ message: string }> {
    if (!refreshToken) {
      return { message: 'Logged out successfully' }
    }

    try {
      const payload = jwt.verify(refreshToken, env.get('JWT_SECRET')) as {
        id?: number
      }

      if (payload.id) {
        const hashed = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex')

        await this.db
          .table('sessions')
          .where('user_id', payload.id)
          .andWhere('refresh_token', hashed)
          .delete()
      }
    } catch {
      // Expired or invalid refresh cookies should still be cleared by the controller.
    }

    return { message: 'Logged out successfully' }
  }

  async verifyEmail(dto: { token: string }): Promise<{ message: string }> {
    const hashed = crypto.createHash('sha256').update(dto.token).digest('hex')

    const user = await this.db
      .table('users')
      .where('email_verify_token', hashed)
      .first()

    if (
      !user?.email_verify_token_expires_at ||
      new Date(user.email_verify_token_expires_at).getTime() < Date.now()
    ) {
      throw new NotFoundException('Invalid or expired token')
    }

    await this.db.table('users').where('id', user.id).update({
      is_email_verified: true,
      email_verify_token: null,
      email_verify_token_expires_at: null,
    })

    return { message: 'Email verified successfully' }
  }

  async resendVerification(dto: {
    email: string
  }): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email)

    const user = await this.db.table('users').where('email', email).first()

    if (!user || user.is_email_verified) {
      return { message: 'If account exists, email will be sent' }
    }

    const { token, hashedToken } = this.generateVerificationToken()

    await this.db.table('users').where('id', user.id).update({
      email_verify_token: hashedToken,
      email_verify_token_expires_at: this.generateEmailVerificationExpiry(),
      email_verify_last_sent_at: new Date(),
    })

    await this.emailVerificationService.sendVerificationEmail(
      user.email,
      token,
      user.name,
      user.id,
    )

    return { message: 'Verification email sent' }
  }

  async forgotPassword(dto: { email: string }): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email)

    const user = await this.db.table('users').where('email', email).first()

    if (!user) {
      return { message: 'If account exists, reset link will be sent' }
    }

    if (user.auth_provider === 'GOOGLE') {
      return { message: 'If account exists, reset link will be sent' }
    }

    const { token, hashedToken } = this.generateVerificationToken()

    await this.db.table('users').where('id', user.id).update({
      password_reset_token: hashedToken,
      password_reset_token_expires_at: this.generatePasswordResetExpiry(),
    })

    await this.emailVerificationService.sendPasswordResetEmail(
      user.email,
      token,
      user.name,
      user.id,
    )

    return { message: 'If account exists, reset link will be sent' }
  }

  async resetPassword(dto: {
    token: string
    password: string
  }): Promise<{ message: string; email: string }> {
    const hashed = crypto.createHash('sha256').update(dto.token).digest('hex')

    const user = await this.db
      .table('users')
      .where('password_reset_token', hashed)
      .first()

    if (
      !user?.password_reset_token_expires_at ||
      new Date(user.password_reset_token_expires_at).getTime() < Date.now()
    ) {
      throw new NotFoundException('Invalid or expired token')
    }

    const password = await bcrypt.hash(dto.password, 10)

    await this.db.table('sessions').where('user_id', user.id).delete()
    await this.db.table('users').where('id', user.id).update({
      password,
      password_reset_token: null,
      password_reset_token_expires_at: null,
      refresh_token: null,
      refresh_token_expires_at: null,
    })

    return { message: 'Password reset successful', email: user.email }
  }

  private async buildAuthResponse(
    userId: number,
    message: string,
    deviceInfo?: DeviceInfoService['extractDeviceInfo'] extends (
      arg: infer A,
    ) => infer R
      ? R
      : never,
  ): Promise<AuthResponse> {
    const user = await this.db.table('users').where('id', userId).first()

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const { accessToken, refreshToken } = await this.generateTokens(payload)
    await this.sessionService.createSession(
      userId,
      refreshToken,
      deviceInfo as any,
    )

    return { message, accessToken, refreshToken, user: user as SafeUser }
  }

  async listSessions(userId: number) {
    return this.sessionService.listSessions(userId)
  }

  async revokeSession(userId: number, sessionId: string) {
    return this.sessionService.revokeSession(userId, sessionId)
  }

  private getSafeUserSelect() {
    return {
      id: true,
      name: true,
      email: true,
      role: true,
      phoneNumber: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      avatar: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    } as const
  }

  async register(dto: {
    name: string
    email: string
    password: string
    captchaId: string
    captchaInput: string
  }): Promise<{
    message: string
    requiresEmailVerification: boolean
    verificationUrl?: string
  }> {
    const email = this.normalizeEmail(dto.email)

    const existing = await this.db.table('users').where('email', email).first()

    if (existing) {
      if (existing.auth_provider === 'GOOGLE') {
        throw new ConflictException('Use Google sign-in for this email')
      }
      throw new ConflictException('Email already registered')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)
    const { token, hashedToken } = this.generateVerificationToken()

    const insertId = await this.db.table('users').insert({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      role: 'USER',
      auth_provider: 'LOCAL',
      is_email_verified: false,
      email_verify_token: hashedToken,
      email_verify_token_expires_at: this.generateEmailVerificationExpiry(),
      email_verify_last_sent_at: new Date(),
    })

    const [user] = await this.db
      .table('users')
      .where('id', insertId[0])
      .first()

    const verificationUrl =
      await this.emailVerificationService.sendVerificationEmail(
        user.email,
        token,
        user.name,
        user.id,
      )

    return {
      message:
        'User registered successfully. Verify your email before logging in.',
      requiresEmailVerification: true,
      verificationUrl:
        process.env.NODE_ENV === 'production' ? undefined : verificationUrl,
    }
  }

  async login(
    dto: { email: string; password: string },
    deviceInfo?: any,
  ): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email)

    const user = await this.db.table('users').where('email', email).first()

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!user.is_email_verified && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Please verify email first')
    }

    void this.emailVerificationService.sendLoginAlert(
      user.email,
      user.name,
      user.id,
      deviceInfo,
    )

    return this.buildAuthResponse(user.id, 'Login successful', deviceInfo)
  }

  async googleAuth(
    dto: { credential: string },
    deviceInfo?: any,
  ): Promise<AuthResponse> {
    const profile = await this.verifyGoogleCredential(dto.credential)

    const googleUser = await this.db
      .table('users')
      .where('google_id', profile.googleId)
      .first()

    if (googleUser) {
      void this.emailVerificationService.sendLoginAlert(
        googleUser.email,
        googleUser.name,
        googleUser.id,
        deviceInfo,
      )

      return this.buildAuthResponse(
        googleUser.id,
        'Google login success',
        deviceInfo,
      )
    }

    const emailUser = await this.db.table('users').where('email', profile.email).first()

    if (emailUser) {
      if (emailUser.auth_provider === 'GOOGLE') {
        void this.emailVerificationService.sendLoginAlert(
          emailUser.email,
          emailUser.name,
          emailUser.id,
          deviceInfo,
        )

        return this.buildAuthResponse(
          emailUser.id,
          'Google login success',
          deviceInfo,
        )
      }

      throw new UnauthorizedException(
        'This email is already registered with password login. Please sign in with your password, or use the account linking option to connect Google sign-in.',
      )
    }

    const insertId = await this.db.table('users').insert({
      name: profile.name,
      email: profile.email,
      google_id: profile.googleId,
      auth_provider: 'GOOGLE',
      password: await bcrypt.hash(this.generateRandomPassword(), 10),
      role: 'USER',
      is_email_verified: true,
    })

    const [user] = await this.db.table('users').where('id', insertId[0]).first()

    return this.buildAuthResponse(
      user.id,
      'Google account created',
      deviceInfo,
    )
  }

  private async verifyGoogleCredential(credential: string): Promise<{
    googleId: string
    email: string
    name: string
  }> {
    const clientId = env.get('GOOGLE_CLIENT_ID', '')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
        { signal: controller.signal },
      )

      if (!res.ok) {
        const errorText = await res
          .text()
          .catch(() => 'Google token verification failed')
        throw new UnauthorizedException(`Invalid Google token: ${errorText}`)
      }

      const data: {
        sub: string
        email: string
        email_verified: string
        aud: string
        name?: string
      } = await res.json()

      if (!data.sub) {
        throw new UnauthorizedException('Invalid Google token')
      }
      if (!data.email) {
        throw new UnauthorizedException('Missing email')
      }
      if (data.email_verified !== 'true') {
        throw new UnauthorizedException('Email not verified')
      }

      if (data.aud !== clientId) {
        throw new UnauthorizedException('Invalid audience')
      }

      return {
        googleId: data.sub,
        email: this.normalizeEmail(data.email),
        name: data.name || 'Google User',
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private generateRandomPassword() {
    return crypto.randomBytes(32).toString('hex')
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    const payload = jwt.verify(refreshToken, env.get('JWT_SECRET')) as {
      id: number
    }

    const user = await this.db.table('users').where('id', payload.id).first()

    if (!user) {
      throw new UnauthorizedException()
    }

    const hashed = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')

    const session = await this.sessionService.findSessionByRefreshToken(
      user.id,
      hashed,
    )

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
      })

    const newHashed = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex')
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.db.transaction(async (trx) => {
      await trx
        .table('sessions')
        .where('id', session.id)
        .andWhere('refresh_token', hashed)
        .update({
          refresh_token: newHashed,
          expires_at: newExpiresAt,
          last_used_at: new Date(),
          updated_at: new Date(),
        })

      await trx.table('users').where('id', user.id).update({
        refresh_token: newHashed,
        refresh_token_expires_at: newExpiresAt,
      })
    })

    const updatedUser = await this.db.table('users').where('id', user.id).first()

    if (!updatedUser) {
      throw new NotFoundException('User not found')
    }

    return {
      message: 'Token refreshed',
      accessToken,
      refreshToken: newRefreshToken,
      user: updatedUser as SafeUser,
    }
  }

  async getSession(
    accessToken?: string,
    refreshToken?: string,
  ): Promise<{
    authenticated: boolean
    refreshed: boolean
    user: SafeUser | null
    accessToken?: string
    refreshToken?: string
  }> {
    if (accessToken) {
      try {
        const payload = jwt.verify(accessToken, env.get('JWT_SECRET')) as {
          id?: number
        }

        if (payload.id) {
          const session = await this.db
            .table('sessions')
            .where('user_id', payload.id)
            .where('expires_at', '>', new Date())
            .select('id')
            .first()

          if (!session) {
            return {
              authenticated: false,
              refreshed: false,
              user: null,
            }
          }

          const profile = await this.getProfile(payload.id)
          return {
            authenticated: true,
            refreshed: false,
            user: profile.user,
          }
        }
      } catch {
        // Fall through to refresh-token recovery below.
      }
    }

    if (!refreshToken) {
      return {
        authenticated: false,
        refreshed: false,
        user: null,
      }
    }

    const refreshedSession = await this.refreshAccessToken(refreshToken)

    return {
      authenticated: true,
      refreshed: true,
      user: refreshedSession.user,
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
    }
  }

  async getProfile(
    userId: number,
  ): Promise<{ message: string; user: SafeUser }> {
    const user = await this.db.table('users').where('id', userId).first()

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return { message: 'Profile loaded', user: user as SafeUser }
  }

  async updateProfile(
    userId: number,
    dto: Record<string, unknown>,
  ): Promise<{ message: string; user: SafeUser }> {
    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = String(dto.name).trim()
    if (dto.phoneNumber !== undefined)
      data.phone_number = String(dto.phoneNumber).trim() || null
    if (dto.addressLine1 !== undefined)
      data.address_line1 = String(dto.addressLine1).trim() || null
    if (dto.addressLine2 !== undefined)
      data.address_line2 = String(dto.addressLine2).trim() || null
    if (dto.city !== undefined) data.city = String(dto.city).trim() || null
    if (dto.state !== undefined) data.state = String(dto.state).trim() || null
    if (dto.postalCode !== undefined)
      data.postal_code = String(dto.postalCode).trim() || null
    if (dto.country !== undefined)
      data.country = String(dto.country).trim() || null
    if (dto.avatar !== undefined)
      data.avatar = String(dto.avatar).trim() || null

    await this.db.table('users').where('id', userId).update(data)

    return this.getProfile(userId)
  }

  async listAddresses(userId: number) {
    return this.db
      .table('user_addresses')
      .where('user_id', userId)
      .orderBy('is_default', 'desc')
      .orderBy('updated_at', 'desc')
  }

  async createAddress(
    userId: number,
    dto: Record<string, unknown>,
  ): Promise<{ message: string; user: SafeUser }> {
    await this.db.table('user_addresses').insert({
      ...dto,
      user_id: userId,
    } as any)

    return this.getProfile(userId)
  }

  async updateAddress(
    userId: number,
    id: number,
    dto: Record<string, unknown>,
  ): Promise<{ message: string; user: SafeUser }> {
    const address = await this.db
      .table('user_addresses')
      .where('id', id)
      .andWhere('user_id', userId)
      .first()

    if (!address) {
      throw new NotFoundException('Address not found')
    }

    await this.db.table('user_addresses').where('id', id).update(dto as any)

    return this.getProfile(userId)
  }

  async removeAddress(
    userId: number,
    id: number,
  ): Promise<{ message: string; user: SafeUser }> {
    const address = await this.db
      .table('user_addresses')
      .where('id', id)
      .andWhere('user_id', userId)
      .first()

    if (!address) {
      throw new NotFoundException('Address not found')
    }

    await this.db.table('user_addresses').where('id', id).delete()

    return this.getProfile(userId)
  }

  async changePassword(
    userId: number,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const user = await this.db.table('users').where('id', userId).first()

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password)
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10)

    await this.db.table('sessions').where('user_id', userId).delete()
    await this.db.table('users').where('id', userId).update({
      password: hashedNewPassword,
      refresh_token: null,
      refresh_token_expires_at: null,
    })

    return { message: 'Password updated successfully' }
  }

  async mergeGuestData(
    userId: number,
    guestToken: string,
  ): Promise<{ message: string }> {
    await this.db.transaction(async (trx) => {
      const guestCartItems = await trx
        .table('cart_items')
        .where('guest_cart_token', guestToken)
        .where('created_at', '>', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))

      for (const guestItem of guestCartItems) {
        const existingItem = await trx
          .table('cart_items')
          .where('user_id', userId)
          .andWhere('product_id', guestItem.product_id)
          .first()

        const product = await trx
          .table('products')
          .where('id', guestItem.product_id)
          .first()

        if (!product || product.stock <= 0) {
          continue
        }

        const nextQuantity = (existingItem?.quantity ?? 0) + guestItem.quantity
        if (nextQuantity > product.stock) {
          continue
        }

        if (existingItem) {
          await trx
            .table('cart_items')
            .where('id', existingItem.id)
            .update({ quantity: nextQuantity })
        } else {
          await trx.table('cart_items').insert({
            user_id: userId,
            product_id: guestItem.product_id,
            quantity: guestItem.quantity,
          })
        }
      }

      await trx
        .table('cart_items')
        .where('guest_cart_token', guestToken)
        .where('created_at', '>', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .delete()

      const guestWishlistItems = await trx
        .table('wishlists')
        .where('guest_wishlist_token', guestToken)
        .where('created_at', '>', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .select('product_id')

      for (const item of guestWishlistItems) {
        const existingWishlist = await trx
          .table('wishlists')
          .where('user_id', userId)
          .andWhere('product_id', item.product_id)
          .first()

        if (existingWishlist) {
          continue
        }

        await trx.table('wishlists').insert({
          user_id: userId,
          product_id: item.product_id,
        })
      }

      await trx
        .table('wishlists')
        .where('guest_wishlist_token', guestToken)
        .where('created_at', '>', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .delete()
    })

    return { message: 'Guest data merged' }
  }

  async deleteAccount(
    userId: number,
    dto: { password: string; confirmation: string },
  ): Promise<{ message: string }> {
    const user = await this.db.table('users').where('id', userId).first()

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) {
      throw new UnauthorizedException('Password is incorrect')
    }

    await this.db.table('sessions').where('user_id', userId).delete()
    await this.db.table('users').where('id', userId).delete()

    return { message: 'Account deleted successfully' }
  }
}
