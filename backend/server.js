const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// In-memory store (can be replaced with Redis)
const rooms = new Map()
const players = new Map()

// Market scenario generators
const marketScenarios = {
  bullish: {
    baseTrend: 0.001, // 0.1% per tick upward
    volatility: 0.0005,
    spikes: 0.002,
  },
  bearish: {
    baseTrend: -0.001, // 0.1% per tick downward
    volatility: 0.0005,
    spikes: -0.002,
  },
  range: {
    baseTrend: 0,
    volatility: 0.0003,
    spikes: 0,
  },
  volatile: {
    baseTrend: 0,
    volatility: 0.002,
    spikes: 0.005,
  },
}

// Generate price movement based on scenario
function generatePriceChange(scenario, basePrice, tickCount) {
  const config = marketScenarios[scenario] || marketScenarios.bullish
  const trend = config.baseTrend
  const volatility = (Math.random() - 0.5) * config.volatility
  const spike = Math.random() < 0.1 ? config.spikes : 0
  const noise = (Math.random() - 0.5) * 0.0002

  const change = trend + volatility + spike + noise
  return basePrice * (1 + change)
}

// Generate initial price for a stock
function getInitialPrice(symbol) {
  const basePrices = {
    RELIANCE: 2500,
    TCS: 3500,
    HDFCBANK: 1650,
    INFY: 1500,
    ICICIBANK: 950,
    BHARTIARTL: 1200,
    SBIN: 600,
    BAJFINANCE: 7500,
    LICI: 650,
    ITC: 450,
    HINDUNILVR: 2500,
    KOTAKBANK: 1800,
    LT: 3500,
    AXISBANK: 1100,
    ASIANPAINT: 3200,
  }
  return basePrices[symbol] || 1000
}

// Create room
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Admin creates room
  socket.on('admin:create-room', (data) => {
    const roomCode = generateRoomCode()
    const room = {
      code: roomCode,
      stocks: data.stocks || ['RELIANCE'],
      scenario: data.scenario || 'bullish',
      duration: data.duration || 300, // 5 minutes
      status: 'waiting',
      timeRemaining: data.duration || 300,
      startTime: null,
      players: [],
      marketData: {},
      gameInterval: null,
      tickInterval: null,
    }

    // Initialize market data for each stock
    room.stocks.forEach((symbol) => {
      room.marketData[symbol] = {
        price: getInitialPrice(symbol),
        candles: [],
        lastCandleTime: Date.now(),
        tickCount: 0,
      }
    })

    rooms.set(roomCode, room)
    socket.join(roomCode)
    socket.emit('room:created', { roomCode })
    console.log(`Room created: ${roomCode}`)
  })

  // Player joins room
  socket.on('player:join', (data) => {
    const { roomCode, playerName } = data
    const room = rooms.get(roomCode)

    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    if (room.status === 'ended') {
      socket.emit('error', { message: 'Game has ended' })
      return
    }

    if (room.players.length >= 10) {
      socket.emit('error', { message: 'Room is full' })
      return
    }

    const playerId = socket.id
    const player = {
      id: playerId,
      name: playerName,
      balance: 500000,
      positions: [],
      trades: 0,
      pnl: 0,
      roi: 0,
    }

    room.players.push(player)
    players.set(playerId, { roomCode, player })
    socket.join(roomCode)

    socket.emit('player:joined', {
      balance: player.balance,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        balance: p.balance,
        pnl: p.pnl,
        roi: p.roi,
        trades: p.trades,
      })),
    })

    socket.emit('game:state', {
      status: room.status,
      timeRemaining: room.timeRemaining,
      stocks: room.stocks,
      isAdmin: playerName === 'ADMIN',
    })

    // Send current market data
    Object.keys(room.marketData).forEach((symbol) => {
      const market = room.marketData[symbol]
      socket.emit('market:candle', {
        symbol,
        time: Math.floor(market.lastCandleTime / 1000),
        open: market.price,
        high: market.price,
        low: market.price,
        close: market.price,
      })
    })

    io.to(roomCode).emit('leaderboard:update', calculateLeaderboard(room))
    console.log(`Player ${playerName} joined room ${roomCode}`)
  })

  // Admin starts game
  socket.on('admin:start-game', (data) => {
    const room = rooms.get(data.roomCode)
    if (!room) return

    room.status = 'active'
    room.startTime = Date.now()

    // Start market ticks (every 500ms)
    room.tickInterval = setInterval(() => {
      if (room.status !== 'active') return

      room.stocks.forEach((symbol) => {
        const market = room.marketData[symbol]
        market.tickCount++
        const newPrice = generatePriceChange(
          room.scenario,
          market.price,
          market.tickCount
        )
        market.price = Math.max(newPrice, 1) // Ensure price doesn't go below 1

        const currentTime = Math.floor(Date.now() / 1000)
        const candleTime = Math.floor(market.lastCandleTime / 1000)

        // Emit tick
        io.to(data.roomCode).emit('market:tick', {
          symbol,
          price: market.price,
          time: currentTime,
        })

        // Create new candle every 5 seconds
        if (currentTime - candleTime >= 5) {
          const candle = {
            symbol,
            time: currentTime,
            open: market.price,
            high: market.price,
            low: market.price,
            close: market.price,
          }
          market.candles.push(candle)
          market.lastCandleTime = Date.now() * 1000

          io.to(data.roomCode).emit('market:candle', candle)
        } else {
          // Update current candle
          const lastCandle = market.candles[market.candles.length - 1]
          if (lastCandle) {
            lastCandle.high = Math.max(lastCandle.high, market.price)
            lastCandle.low = Math.min(lastCandle.low, market.price)
            lastCandle.close = market.price
          }
        }
      })
    }, 500)

    // Start game timer
    room.gameInterval = setInterval(() => {
      if (room.status !== 'active') return

      room.timeRemaining--
      io.to(data.roomCode).emit('timer:update', room.timeRemaining)

      if (room.timeRemaining <= 0) {
        endGame(data.roomCode)
      }
    }, 1000)

    io.to(data.roomCode).emit('game:state', {
      status: room.status,
      timeRemaining: room.timeRemaining,
    })

    console.log(`Game started in room ${data.roomCode}`)
  })

  // Admin pauses game
  socket.on('admin:pause-game', (data) => {
    const room = rooms.get(data.roomCode)
    if (!room) return

    room.status = 'paused'
    if (room.tickInterval) clearInterval(room.tickInterval)
    if (room.gameInterval) clearInterval(room.gameInterval)

    io.to(data.roomCode).emit('game:state', {
      status: room.status,
      timeRemaining: room.timeRemaining,
    })
  })

  // Admin ends game
  socket.on('admin:end-game', (data) => {
    endGame(data.roomCode)
  })

  // Admin injects volatility
  socket.on('admin:inject-volatility', (data) => {
    const room = rooms.get(data.roomCode)
    if (!room) return

    room.stocks.forEach((symbol) => {
      const market = room.marketData[symbol]
      const volatility = (Math.random() - 0.5) * 0.05 // ±2.5% change
      market.price = market.price * (1 + volatility)
      market.price = Math.max(market.price, 1)

      io.to(data.roomCode).emit('market:tick', {
        symbol,
        price: market.price,
        time: Math.floor(Date.now() / 1000),
      })
    })
  })

  // Player executes trade
  socket.on('trade:execute', (data) => {
    const { roomCode, symbol, type, quantity } = data
    const room = rooms.get(roomCode)
    if (!room || room.status !== 'active') return

    const playerData = players.get(socket.id)
    if (!playerData || playerData.roomCode !== roomCode) return

    const player = playerData.player
    const market = room.marketData[symbol]
    if (!market) return

    const currentPrice = market.price
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) return

    let executed = false

    if (type === 'buy') {
      const cost = currentPrice * qty
      if (player.balance >= cost) {
        player.balance -= cost
        const existingPosition = player.positions.find((p) => p.symbol === symbol && p.type === 'long')
        if (existingPosition) {
          const totalCost = existingPosition.avgPrice * existingPosition.quantity + cost
          const totalQty = existingPosition.quantity + qty
          existingPosition.avgPrice = totalCost / totalQty
          existingPosition.quantity = totalQty
        } else {
          player.positions.push({
            symbol,
            type: 'long',
            quantity: qty,
            avgPrice: currentPrice,
            currentPrice: currentPrice,
          })
        }
        player.trades++
        executed = true
      }
    } else if (type === 'sell') {
      const existingPosition = player.positions.find((p) => p.symbol === symbol && p.type === 'long')
      if (existingPosition && existingPosition.quantity >= qty) {
        const proceeds = currentPrice * qty
        player.balance += proceeds
        existingPosition.quantity -= qty
        if (existingPosition.quantity === 0) {
          player.positions = player.positions.filter((p) => p !== existingPosition)
        }
        player.trades++
        executed = true
      }
    } else if (type === 'short') {
      const margin = currentPrice * qty * 0.5 // 50% margin for short
      if (player.balance >= margin) {
        player.balance -= margin
        const existingPosition = player.positions.find((p) => p.symbol === symbol && p.type === 'short')
        if (existingPosition) {
          const totalMargin = existingPosition.avgPrice * existingPosition.quantity * 0.5 + margin
          const totalQty = existingPosition.quantity + qty
          existingPosition.avgPrice = (totalMargin * 2) / totalQty // Recalculate avg price
          existingPosition.quantity = totalQty
        } else {
          player.positions.push({
            symbol,
            type: 'short',
            quantity: qty,
            avgPrice: currentPrice,
            currentPrice: currentPrice,
          })
        }
        player.trades++
        executed = true
      }
    } else if (type === 'cover') {
      const existingPosition = player.positions.find((p) => p.symbol === symbol && p.type === 'short')
      if (existingPosition && existingPosition.quantity >= qty) {
        const cost = currentPrice * qty
        const margin = existingPosition.avgPrice * qty * 0.5
        const profit = (existingPosition.avgPrice - currentPrice) * qty
        player.balance += margin + profit // Return margin + profit
        existingPosition.quantity -= qty
        if (existingPosition.quantity === 0) {
          player.positions = player.positions.filter((p) => p !== existingPosition)
        }
        player.trades++
        executed = true
      }
    }

    if (executed) {
      updatePlayerPnL(player, room)
      socket.emit('trade:executed', {
        balance: player.balance,
        positions: player.positions,
      })
      io.to(roomCode).emit('leaderboard:update', calculateLeaderboard(room))
    }
  })

  // Disconnect
  socket.on('disconnect', () => {
    const playerData = players.get(socket.id)
    if (playerData) {
      const room = rooms.get(playerData.roomCode)
      if (room) {
        room.players = room.players.filter((p) => p.id !== socket.id)
        io.to(playerData.roomCode).emit('leaderboard:update', calculateLeaderboard(room))
      }
      players.delete(socket.id)
    }
    console.log('Client disconnected:', socket.id)
  })
})

// Helper functions
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function updatePlayerPnL(player, room) {
  let totalPnL = 0
  player.positions.forEach((position) => {
    const market = room.marketData[position.symbol]
    if (market) {
      position.currentPrice = market.price
      if (position.type === 'long') {
        position.pnl = (market.price - position.avgPrice) * position.quantity
      } else {
        position.pnl = (position.avgPrice - market.price) * position.quantity
      }
      totalPnL += position.pnl
    }
  })
  player.pnl = totalPnL
  player.roi = ((player.balance + totalPnL - 500000) / 500000) * 100
}

function calculateLeaderboard(room) {
  return room.players
    .map((player) => ({
      id: player.id,
      name: player.name,
      balance: player.balance,
      pnl: player.pnl,
      roi: player.roi,
      trades: player.trades,
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

function endGame(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return

  room.status = 'ended'

  if (room.tickInterval) clearInterval(room.tickInterval)
  if (room.gameInterval) clearInterval(room.gameInterval)

  // Square off all positions
  room.players.forEach((player) => {
    player.positions.forEach((position) => {
      const market = room.marketData[position.symbol]
      if (market) {
        if (position.type === 'long') {
          player.balance += market.price * position.quantity
        } else {
          // Short position: return margin + profit
          const margin = position.avgPrice * position.quantity * 0.5
          const profit = (position.avgPrice - market.price) * position.quantity
          player.balance += margin + profit
        }
      }
    })
    player.positions = []
    updatePlayerPnL(player, room)
  })

  const leaderboard = calculateLeaderboard(room)
  io.to(roomCode).emit('game:end', { leaderboard })
  io.to(roomCode).emit('leaderboard:update', leaderboard)

  console.log(`Game ended in room ${roomCode}`)
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, players: players.size })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

