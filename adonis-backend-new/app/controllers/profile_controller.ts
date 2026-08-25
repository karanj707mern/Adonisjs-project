import type { HttpContext } from '@adonisjs/core/http';

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

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    return response.json(getUserTransform(auth!.user as any));
  }
}
