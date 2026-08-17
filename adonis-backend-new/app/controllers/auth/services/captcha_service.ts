import { inject, injectable } from '@adonisjs/fold';
import { randomUUID } from 'node:crypto';
import svgCaptcha from 'svg-captcha';
import RedisCacheService from '#services/redis_cache_service';

interface CaptchaEntry {
  text: string;
  expires: number;
}

@injectable()
export default class CaptchaService {
  private readonly inMemoryStore = new Map<string, CaptchaEntry>();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly useRedis: boolean;

  constructor(
    @inject('RedisCache', { global: true })
    private readonly redisCache?: RedisCacheService,
  ) {
    this.useRedis = Boolean(this.redisCache?.isEnabled);

    if (!this.useRedis) {
      this.cleanupTimer = setInterval(
        () => this.cleanupExpiredInMemory(),
        5 * 60 * 1000,
      );
    }
  }

  async generateCaptcha(): Promise<{ data: string; text: string }> {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 150,
      height: 50,
      background: '#ffffff',
      color: true,
      noise: 2,
      ignoreChars: '0o1iIL',
    });

    const id = randomUUID();
    const expires = Date.now() + 5 * 60 * 1000;

    if (this.useRedis && this.redisCache) {
      await this.redisCache.setJson(
        `captcha:${id}`,
        { text: captcha.text.toLowerCase(), expires },
        300,
      );
    } else {
      this.inMemoryStore.set(id, {
        text: captcha.text.toLowerCase(),
        expires,
      });
    }

    return {
      data: captcha.data,
      text: id,
    };
  }

  async verifyCaptcha(id: string, userInput: string): Promise<boolean> {
    if (!id || !userInput) {
      return false;
    }

    let captchaData: CaptchaEntry | null = null;

    if (this.useRedis && this.redisCache) {
      captchaData = await this.redisCache.getJson<CaptchaEntry>(
        `captcha:${id}`,
      );
    } else {
      captchaData = this.inMemoryStore.get(id) ?? null;
    }

    if (!captchaData) {
      return false;
    }

    if (Date.now() > captchaData.expires) {
      this.clearCaptcha(id);
      return false;
    }

    const isValid = captchaData.text === userInput.toLowerCase().trim();
    await this.clearCaptcha(id);

    return isValid;
  }

  private async clearCaptcha(id: string): Promise<void> {
    if (this.useRedis && this.redisCache) {
      await this.redisCache.del(`captcha:${id}`);
    } else {
      this.inMemoryStore.delete(id);
    }
  }

  private cleanupExpiredInMemory(): void {
    const now = Date.now();
    for (const [id, data] of this.inMemoryStore.entries()) {
      if (now > data.expires) {
        this.inMemoryStore.delete(id);
      }
    }
  }
}
