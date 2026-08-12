import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'

export class LocalStorage {
  private uploadsDir: string

  constructor() {
    this.uploadsDir = join(process.cwd(), 'uploads')
  }

  async uploadFile(file: Express.Multer.File, folder?: string, prefix?: string): Promise<{ url: string; key: string }> {
    const uploadPath = folder ? join(this.uploadsDir, folder) : this.uploadsDir
    mkdirSync(uploadPath, { recursive: true })

    const filename = prefix ? `${prefix}-${Date.now()}.webp` : `${Date.now()}-${file.originalname}.webp`
    const filepath = join(uploadPath, filename)

    const optimized = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, progressive: true })
      .toBuffer()

    writeFileSync(filepath, optimized)

    return {
      url: `/uploads/${folder ? `${folder}/` : ''}${filename}`,
      key: filepath,
    }
  }

  async deleteFile(key: string): Promise<void> {
    unlinkSync(key)
  }

  async getSignedUrl(key: string): Promise<string> {
    return key
  }
}
