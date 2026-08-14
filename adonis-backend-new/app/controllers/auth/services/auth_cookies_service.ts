import type { HttpResponse } from '@adonisjs/http-server'
import { randomUUID } from 'node:crypto'

interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'none' | 'strict'
  maxAge?: number
}

export default class AuthCookiesService {
  private getCookieOptions(maxAge?: number): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production'

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      ...(maxAge === undefined ? {} : { maxAge }),
    }
  }

  setAuthCookies(res: HttpResponse, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, this.getCookieOptions(60 * 60 * 1000))
    res.cookie('refreshToken', refreshToken, this.getCookieOptions(7 * 24 * 60 * 60 * 1000))
  }

  clearAuthCookies(res: HttpResponse) {
    res.clearCookie('accessToken', this.getCookieOptions())
    res.clearCookie('refreshToken', this.getCookieOptions())
  }

  setCsrfCookie(res: HttpResponse) {
    const token = randomUUID().replace(/-/g, '')
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }

  clearCsrfCookie(res: HttpResponse) {
    const isProduction = process.env.NODE_ENV === 'production'
    res.clearCookie('csrf-token', {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    })
  }
}
