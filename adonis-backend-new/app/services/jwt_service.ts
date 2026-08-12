import jwt from 'jsonwebtoken'
import type { User } from '#models/user'

export class JwtService {
  private accessSecret: string
  private refreshSecret: string
  private accessExpiry: string
  private refreshExpiry: string

  constructor() {
    this.accessSecret = process.env.JWT_SECRET || 'fallback-access-secret'
    this.refreshSecret = process.env.JWT_SECRET + '_refresh' || 'fallback-refresh-secret'
    this.accessExpiry = process.env.JWT_EXPIRY || '7d'
    this.refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '30d'
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      this.accessSecret,
      {
        expiresIn: this.accessExpiry,
        issuer: 'moringa-backend',
        audience: 'moringa-frontend',
      }
    )
  }

  generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      this.refreshSecret,
      {
        expiresIn: this.refreshExpiry,
        issuer: 'moringa-backend',
        audience: 'moringa-frontend',
      }
    )
  }

  async verifyAccessToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.accessSecret,
        {
          issuer: 'moringa-backend',
          audience: 'moringa-frontend',
        },
        (err, decoded) => {
          if (err) return reject(err)
          resolve(decoded)
        }
      )
    })
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.refreshSecret,
        {
          issuer: 'moringa-backend',
          audience: 'moringa-frontend',
        },
        (err, decoded) => {
          if (err) return reject(err)
          resolve(decoded)
        }
      )
    })
  }
}
