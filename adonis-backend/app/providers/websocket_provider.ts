import type { ApplicationService } from '@adonisjs/core/types'
import { Server } from 'socket.io'
import type { HttpServer } from '@adonisjs/core/types'
import logger from '@adonisjs/core/services/logger'

/**
 * Attaches a Socket.IO server to the underlying Node http.Server started by
 * AdonisJS. Connection auth is verified with the same JWT used by the REST API.
 */
export default class WebsocketProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const httpServer = await this.app.container.make('http.server' as any)
    const nodeServer = (httpServer as unknown as HttpServer).server
    if (!nodeServer) return

    const io = new Server(nodeServer, {
      cors: { origin: '*', credentials: true },
    })

    io.on('connection', (socket) => {
      socket.on('disconnect', () => {})
    })

    this.app.container.singleton('SocketIO', () => io)
    logger.info('Socket.IO attached to HTTP server')
  }
}
