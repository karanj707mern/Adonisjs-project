import { inject } from '@adonisjs/fold'
import type { HttpContext } from '@adonisjs/core/http'
import type { OrderStatus } from '@prisma/client'
import vine from '@vinejs/vine'

import AdminService from './admin_service.ts'

export const updateUserAdminValidator = vine.create(
  vine.object({
    name: vine.string().maxLength(100).optional(),
    email: vine.string().email().maxLength(255).optional(),
    role: vine.string().optional(),
    phoneNumber: vine.string().maxLength(20).optional(),
    isEmailVerified: vine.boolean().optional(),
  })
)

@inject()
export default class AdminController {
  constructor(@inject() private adminService: AdminService) {}

  async getOverview() {
    return this.adminService.getOverview()
  }

  async listUsers() {
    return this.adminService.listUsers()
  }

  async getUser({ params }: HttpContext) {
    const id = Number(params.id)
    const user = await this.adminService.getUser(id)
    if (!user) {
      throw { status: 404, message: 'User not found' }
    }
    return user
  }

  async updateUser({ auth, params, request }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    const dto = await request.validateUsing(updateUserAdminValidator)
    return this.adminService.updateUser(id, dto, adminId)
  }

  async deleteUser({ auth, params }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    return this.adminService.deleteUser(id, adminId)
  }

  async listOrders({ request }: HttpContext) {
    const status = request.input('status') as OrderStatus | undefined
    return this.adminService.listOrders(status)
  }

  async listPendingProducts() {
    return this.adminService.listPendingProducts()
  }

  async approveProduct({ auth, params }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    return this.adminService.approveProduct(id, adminId)
  }

  async rejectProduct({ auth, params, request }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    const reason = request.input('reason') as string | undefined
    return this.adminService.rejectProduct(id, reason, adminId)
  }

  async listPendingReviews() {
    return this.adminService.listPendingReviews()
  }

  async approveReview({ auth, params }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    return this.adminService.approveReview(id, adminId)
  }

  async rejectReview({ auth, params, request }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    const reason = request.input('reason') as string | undefined
    return this.adminService.rejectReview(id, reason, adminId)
  }

  async listPendingBlogPosts() {
    return this.adminService.listPendingBlogPosts()
  }

  async publishBlogPost({ auth, params }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    return this.adminService.publishBlogPost(id, adminId)
  }

  async unpublishBlogPost({ auth, params }: HttpContext) {
    const adminId = (auth!.user as { id: number }).id
    const id = Number(params.id)
    return this.adminService.unpublishBlogPost(id, adminId)
  }
}

