import { defineConfig } from '@adonisjs/cors';

const allowedOrigins = Array.from(
  new Set(
    [
      ...(process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean),
      'http://localhost:3000',
      'http://localhost:4321',
      'http://127.0.0.1:3000',
      'https://*.vercel.app',
    ].filter(Boolean),
  ),
);

const matchesOrigin = (origin: string): boolean => {
  const normalizedOrigin = origin.replace(/\/$/, '');
  return allowedOrigins.some((allowed: string) => {
    const normalizedAllowed = allowed.replace(/\/$/, '');
    if (normalizedAllowed === normalizedOrigin) return true;
    if (!normalizedAllowed.includes('*')) return false;
    const pattern = normalizedAllowed
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*');
    return new RegExp(`^${pattern}$`).test(normalizedOrigin);
  });
};

export default defineConfig({
  enabled: true,
  origin: (origin) => (origin && matchesOrigin(origin) ? origin : false),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Guest-Token',
    'Cookie',
  ],
  exposeHeaders: ['Content-Range', 'Set-Cookie'],
  credentials: true,
  maxAge: 90,
});
