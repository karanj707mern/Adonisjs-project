import { defineConfig } from '#adonisjs/shield'

export default defineConfig({
  enable: process.env.NODE_ENV !== 'test',
  xss: {
    enable: true,
    fieldBlacklist: [],
    headerBlacklist: [],
  },
  csrf: {
    enable: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    filter: (request) => {
      const path = request.path()
      return !path.includes('/webhook/')
    },
  },
})
