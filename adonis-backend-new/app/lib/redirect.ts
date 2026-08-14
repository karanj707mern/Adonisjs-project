import env from '#start/env'
export class AllowedRedirectService {
  private readonly allowedPrefixes: string[] = []

  constructor() {
    const raw = env.get('FRONTEND_URL') || ''
    this.allowedPrefixes = raw
      .split(',')
      .map((value) => value)
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value).origin
        } catch {
          return value.replace(/\/+$/, '')
        }
      })
  }

  ensureAllowed(from: string | null | undefined): string {
    if (!from) return '/'
    const trimmed = from
    if (!trimmed || trimmed === '/') return '/'
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
    try {
      const origin = new URL(trimmed).origin
      if (this.allowedPrefixes.some((prefix) => origin === prefix || origin.startsWith(prefix))) {
        return trimmed
      }
    } catch {
      // fall through
    }
    throw { status: 422, message: 'Redirect target is not allowed.' }
  }
}
