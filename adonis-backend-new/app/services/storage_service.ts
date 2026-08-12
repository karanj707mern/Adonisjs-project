import { CloudinaryStorage } from './cloudinary_storage'
import { LocalStorage } from './local_storage'

export class StorageService {
  private provider: 'local' | 'cloudinary' | 'r2'

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'cloudinary' | 'r2'
  }

  async uploadFile(file: Express.Multer.File, folder?: string, prefix?: string): Promise<{ url: string; key: string }> {
    switch (this.provider) {
      case 'cloudinary':
        return new CloudinaryStorage().uploadFile(file, folder, prefix)
      default:
        return new LocalStorage().uploadFile(file, folder, prefix)
    }
  }

  async deleteFile(key: string): Promise<void> {
    switch (this.provider) {
      case 'cloudinary':
        return new CloudinaryStorage().deleteFile(key)
      default:
        return new LocalStorage().deleteFile(key)
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    switch (this.provider) {
      case 'cloudinary':
        return new CloudinaryStorage().getSignedUrl(key)
      default:
        return new LocalStorage().getSignedUrl(key)
    }
  }
}
