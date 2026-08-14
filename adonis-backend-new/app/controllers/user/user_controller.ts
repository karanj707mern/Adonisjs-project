import type { HttpContext } from '@adonisjs/core/http'
import { Role } from '@prisma/client'

import UserService from './user_service.ts'
import { createUserValidator, updateUserValidator } from './user_validators.ts'

export default class UserController {
  constructor(
    private userService: UserService,
  ) {}

  async create({ request }: HttpContext) {
    const dto = await request.validateUsing(createUserValidator)
    return this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    })
  }

  async findAll() {
    return this.userService.findAll()
  }

  async findOne({ auth, params }: HttpContext) {
    const user = auth!.user as { id: number; role: Role }
    const id = Number(params.id)

    if (user.role !== 'ADMIN' && user.id !== id) {
      throw { status: 403, message: 'You can only access your own account.' }
    }

    return this.userService.findOne(id)
  }

  async update({ auth, request, params }: HttpContext) {
    const user = auth!.user as { id: number; role: Role }
    const id = Number(params.id)

    if (user.role !== 'ADMIN' && user.id !== id) {
      throw { status: 403, message: 'You can only update your own account.' }
    }

    const dto = await request.validateUsing(updateUserValidator)

    return this.userService.update(id, dto)
  }

  async remove({ params }: HttpContext) {
    const id = Number(params.id)
    return this.userService.remove(id)
  }
}
