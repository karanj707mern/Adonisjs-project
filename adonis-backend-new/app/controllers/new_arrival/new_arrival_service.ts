import { inject } from '@adonisjs/fold'
import type { PrismaClient } from '@prisma/client'
import StorageService from '#services/storage_service'

export default class NewArrivalService {
  constructor(
    @inject('Prisma') private prisma: PrismaClient,
    @inject() private storage: StorageService
  ) {}

  async findAll() {
    const dbImages = await this.prisma.newArrival.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return dbImages
  }

  async findActive() {
    const dbImages = await this.prisma.newArrival.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    })

    return dbImages
  }

  async findOne(id: number) {
    const image = await this.prisma.newArrival.findUnique({
      where: { id },
    })

    if (!image) {
      throw { status: 404, message: `New arrival image with ID ${id} not found` }
    }

    return image
  }

  async create(data: Record<string, unknown>) {
    return this.prisma.newArrival.create({
      data: {
        url: data.url as string,
        alt: (data.alt as string | null | undefined) ?? null,
        sortOrder: (data.sortOrder as number | undefined) ?? 0,
        active: (data.active as boolean | undefined) ?? true,
        comingSoon: (data.comingSoon as boolean | undefined) ?? false,
      },
    })
  }

  async uploadImage(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    metadata?: Record<string, unknown>
  ) {
    const result = await this.storage.uploadFile(file, 'new-arrivals', 'new-arrival')

    return this.create({
      url: result.url,
      alt: (metadata?.alt as string) || null,
      sortOrder: (metadata?.sortOrder as number) ?? 0,
      active: (metadata?.active as boolean) ?? true,
      comingSoon: (metadata?.comingSoon as boolean) ?? false,
    })
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.prisma.newArrival.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw { status: 404, message: `New arrival image with ID ${id} not found` }
    }

    const updateData: Record<string, unknown> = {}
    if (data.url !== undefined) updateData.url = data.url as string
    if (data.alt !== undefined) updateData.alt = data.alt as string | null
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder as number
    if (data.active !== undefined) updateData.active = data.active as boolean
    if (data.comingSoon !== undefined) updateData.comingSoon = data.comingSoon as boolean

    return this.prisma.newArrival.update({
      where: { id },
      data: updateData,
    })
  }

  async remove(id: number) {
    const existing = await this.prisma.newArrival.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw { status: 404, message: `New arrival image with ID ${id} not found` }
    }

    return this.prisma.newArrival.delete({
      where: { id },
    })
  }
}
