import type { HttpContext } from '@adonisjs/core/http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '#start/env';
import type { PrismaClient } from '@prisma/client';
import { signupValidator } from '#validators/user';

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

export default class NewAccountController {
  constructor(private prisma: PrismaClient) {}

  async store({ request, serialize }: HttpContext) {
    const { fullName, email, password } =
      await request.validateUsing(signupValidator);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: 'USER',
        authProvider: 'LOCAL',
        isEmailVerified: false,
      },
    });

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
}
