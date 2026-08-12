import type { HttpContext } from '@adonisjs/core/http'
import { PrismaClient } from '#prisma/client'
import { CacheService } from '#services/cache_service'

export default class ProductController {
  private prisma: PrismaClient
  private cache: CacheService

  constructor() {
    this.prisma = new PrismaClient()
    this.cache = new CacheService()
  }

  async featured({ response }: HttpContext) {
    const cacheKey = this.cache.generateKey('products', 'featured')
    let products = await this.cache.get<any[]>(cacheKey)

    if (!products) {
      products = await this.prisma.product.findMany({
        where: { isActive: true, isNewArrival: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
      })
      await this.cache.set(cacheKey, products, 300)
    }

    return response.json({
      statusCode: 200,
      data: products,
    })
  }

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search')

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ])

    return response.json({
      statusCode: 200,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  async show({ params, response }: HttpContext) {
    const product = await this.prisma.product.findUnique({
      where: { id: parseInt(params.id) },
    })

    if (!product) {
      return response.status(404).json({
        statusCode: 404,
        message: 'Product not found',
      })
    }

    return response.json({
      statusCode: 200,
      data: product,
    })
  }

  async adminIndex({ response }: HttpContext) {
    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return response.json({
      statusCode: 200,
      data: products,
    })
  }
}
