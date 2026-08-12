import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

export class WebSocketService {
  private io: SocketIOServer | null = null
  private pubClient: Redis | null = null
  private subClient: Redis | null = null

  initialize(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
        credentials: true,
      },
    })

    this.setupRedisAdapter()
    this.setupMiddleware()
    this.setupNamespaces()

    return this.io
  }

  private async setupRedisAdapter() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.pubClient = new Redis(redisUrl)
      this.subClient = new Redis(redisUrl)

      if (this.io) {
        this.io.adapter(createAdapter(this.pubClient, this.subClient))
      }
    } catch (error) {
      console.warn('Redis adapter setup failed:', error)
    }
  }

  private setupMiddleware() {
    if (!this.io) return

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication error'))
      }

      try {
        const jwtService = new (await import('./jwt_service')).JwtService()
        const decoded = await jwtService.verifyAccessToken(token)
        socket.data.user = decoded
        next()
      } catch (error) {
        next(new Error('Invalid token'))
      }
    })
  }

  private setupNamespaces() {
    if (!this.io) return

    const ordersNamespace = this.io.of('/orders')
    ordersNamespace.on('connection', (socket) => {
      const userId = socket.data.user?.sub
      
      if (userId) {
        socket.join(`user:${userId}`)
      }

      socket.on('disconnect', () => {
        // Handle disconnect
      })
    })

    const productsNamespace = this.io.of('/products')
    productsNamespace.on('connection', (socket) => {
      // Handle product namespace
    })
  }

  async close() {
    if (this.pubClient) await this.pubClient.quit()
    if (this.subClient) await this.subClient.quit()
    if (this.io) await this.io.close()
  }
}
