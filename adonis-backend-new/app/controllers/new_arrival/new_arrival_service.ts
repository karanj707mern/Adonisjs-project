import { injectable } from '@adonisjs/fold'
import { Database } from '@adonisjs/lucid/database'
import StorageService from '#services/storage_service'
import { BadRequestException, NotFoundException } from '@adonisjs/core/http'
import { createNewArrivalValidator } from './new_arrival_validators'

@injectable()
export default class NewArrivalService {
  constructor(
    private db: Database,
    private storage: StorageService,
  ) {}

  async findAll() {
    const dbImages = await this.db
      .table('new_arrival')
      .orderBy('sort_order', 'asc')

    return dbImages
  }

  async findActive() {
    const dbImages = await this.db
      .table('new_arrival')
      .where('active', true)
      .orderBy('sort_order', 'asc')

    return dbImages
  }

  async findOne(id: number) {
    const image = await this.db.table('new_arrival').where('id', id).first()

    if (!image) {
      throw new NotFoundException(`New arrival image with ID ${id} not found`)
    }

    return image
  }

  async create(data: Record<string, unknown>) {
    const insertId = await this.db.table('new_arrival').insert({
      url: data.url as string,
      alt: (data.alt as string | null | undefined) ?? null,
      sort_order: (data.sortOrder as number | undefined) ?? 0,
      active: (data.active as boolean | undefined) ?? true,
      coming_soon: (data.comingSoon as boolean | undefined) ?? false,
    })

    const [result] = await this.db
      .table('new_arrival')
      .where('id', insertId[0])
      .first()

    return result
  }

  async uploadImage(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    metadata?: Record<string, unknown>,
  ) {
    const result = await this.storage.uploadFile(
      file,
      'new-arrivals',
      'new-arrival',
    )

    return this.create({
      url: result.url,
      alt: (metadata?.alt as string) || null,
      sortOrder: (metadata?.sortOrder as number) ?? 0,
      active: (metadata?.active as boolean) ?? true,
      comingSoon: (metadata?.comingSoon as boolean) ?? false,
    })
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.db
      .table('new_arrival')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException(`New arrival image with ID ${id} not found`)
    }

    const updateData: Record<string, unknown> = {}
    if (data.url !== undefined) updateData.url = data.url as string
    if (data.alt !== undefined) updateData.alt = data.alt as string | null
    if (data.sortOrder !== undefined)
      updateData.sort_order = data.sortOrder as number
    if (data.active !== undefined) updateData.active = data.active as boolean
    if (data.comingSoon !== undefined)
      updateData.coming_soon = data.comingSoon as boolean

    await this.db.table('new_arrival').where('id', id).update(updateData)

    const [result] = await this.db
      .table('new_arrival')
      .where('id', id)
      .first()

    return result
  }

  async remove(id: number) {
    const existing = await this.db
      .table('new_arrival')
      .where('id', id)
      .select('id')
      .first()

    if (!existing) {
      throw new NotFoundException(`New arrival image with ID ${id} not found`)
    }

    await this.db.table('new_arrival').where('id', id).delete()

    return { message: 'New arrival removed' }
  }
}
