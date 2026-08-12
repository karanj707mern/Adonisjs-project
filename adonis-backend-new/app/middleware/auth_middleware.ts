import type { HttpContext } from '@adonisjs/core/http'
import { UnauthorizedException } from '@adonisjs/core/exceptions'
import JwtService from '#services/jwt_service'

export default class AuthMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    const authHeader = request.header('authorization')
    const accessToken = request.cookie('accessToken')
    const token = authHeader?.replace('Bearer ', '') || accessToken

    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      const jwtService = new JwtService()
      const payload = await jwtService.verifyAccessToken(token)
      
      const User = (await import('#models/user')).default
      const user = await User.find(payload.sub)
      
      if (!user) {
        throw new UnauthorizedException('Invalid token')
      }

      request.user = user
      await next()
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
