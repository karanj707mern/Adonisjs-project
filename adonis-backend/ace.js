import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'
import { Ignitor } from '@adonisjs/core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const appRoot = pathToFileURL(__dirname).href

const ignitor = new Ignitor(appRoot, {
  importer: (filePath) => import(filePath),
})

ignitor.httpServer().start()
