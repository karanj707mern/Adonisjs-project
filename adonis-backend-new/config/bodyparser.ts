import { defineConfig } from '@adonisjs/bodyparser';

export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    limit: '10mb',
    types: ['application/json', 'application/vnd.api+json'],
  },
  raw: {
    limit: '10mb',
    types: ['text/*'],
  },
  multipart: {
    autoProcess: true,
    processManually: [],
    maxFields: 1000,
    limit: '10mb',
    types: ['multipart/form-data'],
  },
});
