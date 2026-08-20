import { injectable, inject } from '@adonisjs/fold';
import {  BadRequestException  } from '#exceptions/http_exceptions';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';
import { randomInt } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import env from '#start/env';

const QUALITY = 80;
const MAX_DIMENSION = 1200;

export default class StorageService {
  private provider: 'cloudinary' | 'local';
  private cloudName: string | null = null;
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private folder: string | null = 'moringa-store';
  private publicUrl: string | null = null;
  private uploadPreset: string | null = null;

  constructor() {
    this.provider = (env.get('STORAGE_PROVIDER') || 'cloudinary') as
      'cloudinary' | 'local';
    this.cloudName = env.get('STORAGE_CLOUDINARY_CLOUD_NAME') || null;
    this.apiKey = env.get('STORAGE_CLOUDINARY_API_KEY') || null;
    this.apiSecret = env.get('STORAGE_CLOUDINARY_API_SECRET') || null;
    this.folder = env.get('STORAGE_CLOUDINARY_FOLDER') || 'moringa-store';
    this.publicUrl = env.get('STORAGE_CLOUDINARY_PUBLIC_URL') || null;
    this.uploadPreset = env.get('STORAGE_CLOUDINARY_UPLOAD_PRESET') || null;

    if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    } else {
      console.warn(
        'Cloudinary credentials missing; uploads fall back to local storage',
      );
    }
  }

  get isCloudinaryProvider(): boolean {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  }

  async uploadFile(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    folder?: string,
    prefix?: string,
  ): Promise<{ url: string; key: string }> {
    await this.validateImage(file.buffer);
    if (this.isCloudinaryProvider) {
      try {
        return await this.uploadToCloudinary(file, folder, prefix);
      } catch (error) {
        console.warn(
          `Cloudinary upload failed, falling back to local: ${(error as Error).message}`,
        );
      }
    }
    return this.uploadLocal(file, folder, prefix);
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isCloudinaryProvider) return this.deleteLocal(key);
    try {
      await cloudinary.uploader.destroy(key, { resource_type: 'image' });
      return;
    } catch (error) {
      console.warn(
        `Cloudinary delete failed for ${key}: ${(error as Error).message}`,
      );
    }
    if (!key.includes('/')) return this.deleteLocal(key);
  }

  getSignedUrl(key: string): string {
    if (this.isCloudinaryUrl(key)) return key;
    return `/uploads/${key}`;
  }

  listFiles(folder: string): string[] {
    const sanitizedFolder = this.sanitize(folder);
    const uploadsPath = join(process.cwd(), 'uploads', sanitizedFolder);
    if (!existsSync(uploadsPath)) return [];
    return readdirSync(uploadsPath).filter((file) => {
      const ext = extname(file).toLowerCase();
      return ['.webp', '.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
  }

  private async uploadToCloudinary(
    file: { buffer: Buffer },
    folder?: string,
    prefix?: string,
  ): Promise<{ url: string; key: string }> {
    const targetFolder = folder || this.folder || 'moringa-store';
    const publicId = this.buildPublicId(targetFolder, prefix);
    const optimized = await this.optimizeImage(file.buffer);
    const result = await cloudinary.uploader.upload(
      `data:image/webp;base64,${optimized.toString('base64')}`,
      {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
        format: 'webp',
        flags: 'progressive',
        ...(this.uploadPreset ? { upload_preset: this.uploadPreset } : {}),
      },
    );
    return { url: result.secure_url, key: result.public_id };
  }

  private async uploadLocal(
    file: { buffer: Buffer },
    folder?: string,
    prefix?: string,
  ): Promise<{ url: string; key: string }> {
    const sanitizedFolder = folder ? this.sanitize(folder) : '';
    const uploadsPath = join(process.cwd(), 'uploads', sanitizedFolder);
    if (!existsSync(uploadsPath)) mkdirSync(uploadsPath, { recursive: true });
    const filename = this.generateFilename(sanitizedFolder, prefix);
    const filepath = join(uploadsPath, filename);
    const optimized = await this.optimizeImage(file.buffer);
    writeFileSync(filepath, optimized);
    return {
      url: `/uploads/${sanitizedFolder ? sanitizedFolder + '/' : ''}${filename}`,
      key: sanitizedFolder ? `${sanitizedFolder}/${filename}` : filename,
    };
  }

  private generateFilename(folder?: string, prefix?: string): string {
    const sanitizedFolder = folder ? this.sanitize(folder) : '';
    if (!prefix) {
      return `${Date.now()}-${randomInt(0, 1e9).toString()}.webp`;
    }
    const uploadsPath = join(process.cwd(), 'uploads', sanitizedFolder);
    let maxNumber = 0;
    if (existsSync(uploadsPath)) {
      const pattern = new RegExp(`^${prefix}-(\\d+)\\.webp$`, 'i');
      for (const file of readdirSync(uploadsPath)) {
        const match = file.match(pattern);
        if (match)
          maxNumber = Math.max(maxNumber, Number.parseInt(match[1], 10));
      }
    }
    return `${prefix}-${maxNumber + 1}.webp`;
  }

  private async validateImage(buffer: Buffer): Promise<void> {
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.format) throw new BadRequestException('Invalid image file');
    } catch {
      throw new BadRequestException('Invalid image file');
    }
  }

  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toBuffer();
  }

  private deleteLocal(key: string): void {
    const filepath = join(process.cwd(), 'uploads', this.sanitize(key));
    if (existsSync(filepath)) unlinkSync(filepath);
  }

  private buildPublicId(folder: string, prefix?: string): string {
    const slug = prefix
      ? prefix
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : `${Date.now()}-${randomInt(0, 1e9).toString()}`;
    return `${this.sanitize(folder)}/${slug}`;
  }

  private isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  private sanitize(value: string): string {
    return value
      .replace(/^(\.\.(\/)?|(\/\.\.)+|\/\.{1,2}$)/, '')
      .replace(/[\\]+/g, '/');
  }
}
