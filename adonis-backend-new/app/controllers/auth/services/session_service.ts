import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import * as crypto from 'node:crypto'

interface DeviceInfo {
  userAgent?: string
  browser?: string
  os?: string
  device?: string
  ip?: string
  country?: string
  city?: string
  region?: string
  timezone?: string
}

@injectable()
export default class SessionService {
  constructor(private db: Database) {}

  async createSession(
    userId: number,
    refreshToken: string,
    deviceInfo?: DeviceInfo,
  ): Promise<void> {
    const hashed = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')
    const id = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.db.table('sessions').insert({
      id,
      user_id: userId,
      refresh_token: hashed,
      user_agent: deviceInfo?.userAgent || null,
      ip: deviceInfo?.ip || null,
      country: deviceInfo?.country || null,
      city: deviceInfo?.city || null,
      device: deviceInfo?.device || null,
      browser: deviceInfo?.browser || null,
      os: deviceInfo?.os || null,
      expires_at: expiresAt,
      updated_at: new Date(),
    })

    await this.db.table('users').where('id', userId).update({
      refresh_token: hashed,
      refresh_token_expires_at: expiresAt,
    })
  }

  async listSessions(userId: number) {
    return this.db
      .table('sessions')
      .where('user_id', userId)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .select(
        'id',
        'user_agent',
        'ip',
        'country',
        'city',
        'device',
        'browser',
        'os',
        'created_at',
        'last_used_at',
        'expires_at',
      )
  }

  async revokeSession(userId: number, sessionId: string) {
    await this.db
      .table('sessions')
      .where('id', sessionId)
      .where('user_id', userId)
      .delete()

    return { message: 'Session revoked' }
  }

  async createRotatedSession(
    userId: number,
    userAgent?: string,
    ip?: string,
    country?: string,
    city?: string,
    device?: string,
    browser?: string,
    os?: string,
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    const newRefreshToken = crypto.randomBytes(32).toString('hex')
    const hashed = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex')
    const newSessionId = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.db.table('sessions').insert({
      id: newSessionId,
      user_id: userId,
      refresh_token: hashed,
      user_agent: userAgent || null,
      ip: ip || null,
      country: country || null,
      city: city || null,
      device: device || null,
      browser: browser || null,
      os: os || null,
      expires_at: expiresAt,
      created_at: new Date(),
      updated_at: new Date(),
      last_used_at: new Date(),
    })

    await this.db.table('users').where('id', userId).update({
      refresh_token: hashed,
      refresh_token_expires_at: expiresAt,
    })

    return { sessionId: newSessionId, expiresAt }
  }

  async getSessionById(userId: number, sessionId: string) {
    return this.db
      .table('sessions')
      .where('id', sessionId)
      .where('user_id', userId)
      .first()
  }

  async deleteAllUserSessions(userId: number) {
    await this.db.table('sessions').where('user_id', userId).delete()
  }

  async findSessionByRefreshToken(
    userId: number,
    hashedRefreshToken: string,
  ) {
    return this.db
      .table('sessions')
      .where('user_id', userId)
      .where('refresh_token', hashedRefreshToken)
      .where('expires_at', '>', new Date())
      .first()
  }
}
