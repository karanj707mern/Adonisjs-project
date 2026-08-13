import { Ignitor } from '@adonisjs/core'

const importer = (filePath) => import(filePath)

new Ignitor(import.meta.url, importer)
  .httpServer()
  .start()
