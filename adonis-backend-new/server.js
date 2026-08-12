import { Ignitor } from '@adonisjs/core'

const ignitor = new Ignitor(import.meta.dirname)
await ignitor.httpServer().start()
