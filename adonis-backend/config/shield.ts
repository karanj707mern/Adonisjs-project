import { defineConfig } from '@adonisjs/shield'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://checkout.razorpay.com',
        'https://accounts.google.com',
        'https://apis.google.com',
      ],
      imgSrc: ["'self'", 'data:', 'https://*.razorpay.com', 'https://res.cloudinary.com'],
      connectSrc: [
        "'self'",
        'https://api.razorpay.com',
        'https://checkout.razorpay.com',
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
      ],
      frameSrc: ["'self'", 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
    },
  },
  xFrameOptions: false,
  hsts: isProduction
    ? { maxAge: '31536000', includeSubDomains: true, preload: true }
    : false,
})
