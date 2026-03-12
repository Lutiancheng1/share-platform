import { io, Socket } from 'socket.io-client'

const DEFAULT_WS_PORT = process.env.NEXT_PUBLIC_WS_PORT || '3001'

const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_WS_PORT}`
  }
  return `http://localhost:${DEFAULT_WS_PORT}`
}

const WS_URL = getWsUrl()

class SocketService {
  private socket: Socket | null = null

  connect(token?: string): Socket {
    if (!this.socket) {
      console.log('🔌 开始连接WebSocket...', { token: token ? '有' : '无' })

      this.socket = io(WS_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000, // 10秒连接超时
        auth: {
          token: token || ''
        }
      })

      this.socket.on('connect', () => {
        console.log('✅ WebSocket连接成功', this.socket?.id)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket断开连接', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket连接错误:', error.message)
        console.error('详细信息:', error)
      })

      this.socket.on('connect_timeout', () => {
        console.error('⏱️ WebSocket连接超时（10秒）')
      })

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 WebSocket重连尝试 #${attemptNumber}`)
      })

      this.socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket重连失败（已尝试5次）')
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const socketService = new SocketService()
export default socketService
