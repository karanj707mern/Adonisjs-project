import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'
import { JwtService } from '#services/jwt_service'
import { MailService } from '#services/mail_service'
import { v4 as uuidv4 } from 'uuid'

export default class AuthController {
  private jwtService: JwtService
  private mailService: MailService

  constructor() {
    this.jwtService = new JwtService()
    this.mailService = new MailService()
  }

  async register({ request, response }: HttpContext) {
    const { name, email, password } = request.body()

    const prisma = new PrismaClient()
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Email already registered',
      })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: 'USER',
        authProvider: 'LOCAL',
      },
    })

    const accessToken = this.jwtService.generateAccessToken(user)
    const refreshToken = this.jwtService.generateRefreshToken(user)

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    response.cookie('accessToken', accessToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response.json({
      statusCode: 200,
      message: 'Registration successful',
      data: { user, accessToken, refreshToken },
    })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = request.body()

    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return response.status(401).json({
        statusCode: 401,
        message: 'Invalid credentials',
      })
    }

    // Note: In production, use bcrypt.compare()
    const passwordValid = user.password === password
    if (!passwordValid) {
      return response.status(401).json({
        statusCode: 401,
        message: 'Invalid credentials',
      })
    }

    const accessToken = this.jwtService.generateAccessToken(user)
    const refreshToken = this.jwtService.generateRefreshToken(user)

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    response.cookie('accessToken', accessToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response.json({
      statusCode: 200,
      message: 'Login successful',
      data: { user, accessToken, refreshToken },
    })
  }

  async logout({ response }: HttpContext) {
    response.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response.json({
      statusCode: 200,
      message: 'Logout successful',
    })
  }

  async refresh({ request, response }: HttpContext) {
    const { refreshToken } = request.body()

    try {
      const decoded = await this.jwtService.verifyRefreshToken(refreshToken)

      const prisma = new PrismaClient()
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      })

      if (!user) {
        return response.status(401).json({
          statusCode: 401,
          message: 'Invalid refresh token',
        })
      }

      const accessToken = this.jwtService.generateAccessToken(user)

      response.cookie('accessToken', accessToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })

      return response.json({
        statusCode: 200,
        data: { accessToken },
      })
    } catch {
      return response.status(401).json({
        statusCode: 401,
        message: 'Invalid refresh token',
      })
    }
  }

  async session({ request, response }: HttpContext) {
    const accessToken = request.cookie('accessToken')

    if (!accessToken) {
      return response.json({
        statusCode: 200,
        data: { user: null },
      })
    }

    try {
      const decoded = await this.jwtService.verifyAccessToken(accessToken)

      const prisma = new PrismaClient()
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      })

      return response.json({
        statusCode: 200,
        data: {
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null,
        },
      })
    } catch {
      return response.json({
        statusCode: 200,
        data: { user: null },
      })
    }
  }

  async profile({ auth }: HttpContext) {
    const user = auth.user as any

    return {
      statusCode: 200,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
      },
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.body()

    const prisma = new PrismaClient()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return response.json({
        statusCode: 200,
        message: 'If an account exists, a reset email will be sent',
      })
    }

    const resetToken = uuidv4()
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: resetToken,
        refreshTokenExpiresAt: resetExpires,
      },
    })

    await this.mailService.sendEmail(email, 'Reset your password', 'password-reset', {
      resetLink: `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`,
    })

    return response.json({
      statusCode: 200,
      message: 'If an account exists, a reset email will be sent',
    })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = request.body()

    const prisma = new PrismaClient()
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: token,
        refreshTokenExpiresAt: { gte: new Date() },
      },
    })

    if (!user) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Invalid or expired reset token',
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    })

    return response.json({
      statusCode: 200,
      message: 'Password reset successful',
    })
  }
}
