import { Ignitor } from '@adonisjs/core'
import { fileURLToPath } from 'node:url'

const importer = (filePath: string) => import(filePath)

new Ignitor(import.meta.url, importer).ace().start()
