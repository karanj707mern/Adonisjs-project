import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

export class CloudinaryStorage {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.STORAGE_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.STORAGE_CLOUDINARY_API_KEY,
      api_secret: process.env.STORAGE_CLOUDINARY_API_SECRET,
    })
  }

  async uploadFile(file: Express.Multer.File, folder?: string, prefix?: string): Promise<{ url: string; key: string }> {
    const bytes = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, progressive: true })
      .toBuffer()

    const result = await cloudinary.uploader.upload(
      `data:image/webp;base64,${bytes.toString('base64')}`,
      {
        folder: folder ? `${process.env.STORAGE_CLOUDINARY_FOLDER}/${folder}` : process.env.STORAGE_CLOUDINARY_FOLDER,
        public_id: prefix ? `${prefix}-${Date.now()}` : undefined,
        resource_type: 'image',
        format: 'webp',
      }
    )

    return {
      url: result.secure_url,
      key: result.public_id,
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }

  async getSignedUrl(publicId: string): Promise<string> {
    const result = cloudinary.url(publicId, { secure: true })
    return result
  }
}
