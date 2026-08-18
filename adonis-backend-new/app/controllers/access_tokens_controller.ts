import type { HttpContext } from '@adonisjs/core/http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '#start/env';
import { UnauthorizedException } from '@adonisjs/core/http';
import type { PrismaClient } from '@prisma/client';
import { loginValidator } from '#validators/user';

function getUserTransform(user: {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    initials: initials || user.email.slice(0, 2).toUpperCase(),
  };
}

export default class AccessTokensController {
  constructor(private prisma: PrismaClient) {}

  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator);

    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.get('JWT_SECRET'),
      { expiresIn: '1h' },
    );

    return serialize({
      user: getUserTransform(user),
      token,
    });
  }

  async destroy({ auth }: HttpContext) {
    const user = auth!.user as { currentAccessToken?: { identifier: string } };

    if (user.currentAccessToken) {
      await this.prisma.session.deleteMany({
        where: {
          userId: user.id,
          refreshToken: user.currentAccessToken.identifier,
        },
      });
    }

    return {
      message: 'Logged out successfully',
    };
  }
}
