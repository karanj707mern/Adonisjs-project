import { defineConfig } from '@adonisjs/shield';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // required by Qwik SSR inline styles
        'https://fonts.googleapis.com',
      ],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Qwik serialization inline script
        'https://checkout.razorpay.com',
        'https://accounts.google.com',
        'https://apis.google.com',
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.razorpay.com',
        'https://res.cloudinary.com',
      ],
      connectSrc: [
        "'self'",
        'wss:',
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
      ],
      frameSrc: [
        "'self'",
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
        'https://accounts.google.com',
      ],
    },
  },
  xFrame: { enabled: false }, // frontend serves its own frame policy
  hsts: isProduction
    ? {
        enabled: true,
        maxAge: '31536000',
        includeSubDomains: true,
        preload: true,
      }
    : undefined,
});
