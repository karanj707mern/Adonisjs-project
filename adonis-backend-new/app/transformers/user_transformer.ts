import type { User as PrismaUser } from '@prisma/client';
import { BaseTransformer } from '@adonisjs/core/transformers';

export default class UserTransformer extends BaseTransformer<PrismaUser> {
  toObject() {
    const user = this.resource;
    const name = user.name || '';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      id: user.id,
      fullName: name,
      email: user.email,
      initials,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
