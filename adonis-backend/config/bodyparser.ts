import { defineConfig } from '@adonisjs/bodyparser'

export default defineConfig({
  whitelist: ['application/json', 'application/vnd.api+json', 'multipart/form-data'],
  json: {
    encoding: 'utf-8',
    limit: '10mb',
    types: ['application/json', 'application/vnd.api+json'],
  },
  raw: {
    encoding: 'utf-8',
    limit: '10mb',
    types: ['text/*'],
  },
  multipart: {
    autoProcess: true,
    processManually: [],
    encoding: 'utf-8',
    maxFields: 1000,
    limit: '10mb',
    types: ['multipart/form-data'],
  },
})
