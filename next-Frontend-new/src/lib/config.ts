const API_BASE_URL = 'http://localhost:5000/api/v1'

export const API_BASE = API_BASE_URL
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '')

export function resolveImageUrl(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed
  }

  return new URL(trimmed, ASSET_BASE_URL).toString()
}
