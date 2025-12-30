import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const connectSocket = (roomCode: string, playerName: string): Socket => {
  if (socket?.connected) {
    return socket
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
  })

  socket.on('connect', () => {
    console.log('Connected to server')
    socket?.emit('player:join', { roomCode, playerName })
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = (): Socket | null => {
  return socket
}

