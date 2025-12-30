'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import Leaderboard from '@/components/Leaderboard'

const INDIAN_STOCKS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'ICICIBANK',
  'BHARTIARTL',
  'SBIN',
  'BAJFINANCE',
  'LICI',
  'ITC',
  'HINDUNILVR',
  'KOTAKBANK',
  'LT',
  'AXISBANK',
  'ASIANPAINT',
]

const MARKET_SCENARIOS = [
  { id: 'bullish', name: 'Bull Market', description: 'Strong upward trend' },
  { id: 'bearish', name: 'Bear Market', description: 'Strong downward trend' },
  { id: 'range', name: 'Range Bound', description: 'Sideways movement' },
  { id: 'volatile', name: 'High Volatility', description: 'Rapid price swings' },
]

interface Player {
  id: string
  name: string
  balance: number
  pnl: number
  roi: number
  trades: number
  positions?: any[]
}

export default function AdminPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['RELIANCE'])
  const [scenario, setScenario] = useState('bullish')
  const [gameStatus, setGameStatus] = useState<'idle' | 'active' | 'paused' | 'ended'>('idle')
  const [players, setPlayers] = useState<Player[]>([])
  const [timeRemaining, setTimeRemaining] = useState(300)
  const [isProjectorMode, setIsProjectorMode] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    const socket = connectSocket('', 'ADMIN')
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('admin:create-room', {
        stocks: selectedStocks,
        scenario,
        duration: 300,
      })
    })

    socket.on('room:created', (data: any) => {
      setRoomCode(data.roomCode)
    })

    socket.on('player:joined', (data: any) => {
      setPlayers(data.players || [])
    })

    socket.on('game:state', (state: any) => {
      setGameStatus(state.status)
      setTimeRemaining(state.timeRemaining)
    })

    socket.on('leaderboard:update', (data: Player[]) => {
      setPlayers(data)
    })

    socket.on('timer:update', (time: number) => {
      setTimeRemaining(time)
    })

    return () => {
      disconnectSocket()
    }
  }, [])

  const handleStartGame = () => {
    const socket = getSocket()
    if (socket && roomCode) {
      socket.emit('admin:start-game', { roomCode })
    }
  }

  const handlePauseGame = () => {
    const socket = getSocket()
    if (socket && roomCode) {
      socket.emit('admin:pause-game', { roomCode })
    }
  }

  const handleEndGame = () => {
    const socket = getSocket()
    if (socket && roomCode) {
      socket.emit('admin:end-game', { roomCode })
    }
  }

  const handleInjectVolatility = () => {
    const socket = getSocket()
    if (socket && roomCode) {
      socket.emit('admin:inject-volatility', { roomCode })
    }
  }

  const toggleStock = (stock: string) => {
    setSelectedStocks((prev) => {
      if (prev.includes(stock)) {
        return prev.filter((s) => s !== stock)
      } else if (prev.length < 3) {
        return [...prev, stock]
      }
      return prev
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isProjectorMode) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold">Room: {roomCode}</h1>
              <div className="text-4xl font-bold text-blue-600">{formatTime(timeRemaining)}</div>
            </div>
            <Leaderboard players={players} isProjectorMode={true} />
          </div>
          <button
            onClick={() => setIsProjectorMode(false)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Exit Projector Mode
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
          {roomCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Room Code:</p>
              <p className="text-3xl font-bold text-blue-600">{roomCode}</p>
              <p className="text-sm text-gray-600 mt-2">
                Share this code with players or use the QR code in the game room
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Game Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stock Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Select Stocks (1-3)</h2>
              <div className="grid grid-cols-3 gap-2">
                {INDIAN_STOCKS.map((stock) => (
                  <button
                    key={stock}
                    onClick={() => toggleStock(stock)}
                    disabled={!selectedStocks.includes(stock) && selectedStocks.length >= 3}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedStocks.includes(stock)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                    }`}
                  >
                    {stock}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Market Scenario</h2>
              <div className="grid grid-cols-2 gap-4">
                {MARKET_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScenario(s.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      scenario === s.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold">{s.name}</div>
                    <div className="text-sm text-gray-600">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Game Controls</h2>
              <div className="flex gap-4">
                {gameStatus === 'idle' && (
                  <button
                    onClick={handleStartGame}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    Start Game
                  </button>
                )}
                {gameStatus === 'active' && (
                  <>
                    <button
                      onClick={handlePauseGame}
                      className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-all"
                    >
                      Pause
                    </button>
                    <button
                      onClick={handleEndGame}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                    >
                      End Game
                    </button>
                    <button
                      onClick={handleInjectVolatility}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                    >
                      Inject Volatility
                    </button>
                  </>
                )}
                {gameStatus === 'paused' && (
                  <>
                    <button
                      onClick={handleStartGame}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                    >
                      Resume
                    </button>
                    <button
                      onClick={handleEndGame}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                    >
                      End Game
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsProjectorMode(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
                >
                  Projector Mode
                </button>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-blue-600">
                  Time: {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-600">
                  Status: {gameStatus.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Player Positions */}
            {players.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Player Positions</h2>
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{player.name}</span>
                        <span
                          className={`font-semibold ${
                            player.pnl >= 0 ? 'text-profit' : 'text-loss'
                          }`}
                        >
                          P&L: {player.pnl >= 0 ? '+' : ''}₹
                          {player.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {player.positions && player.positions.length > 0 && (
                        <div className="text-sm text-gray-600 ml-4">
                          {player.positions.map((pos: any, idx: number) => (
                            <div key={idx}>
                              {pos.symbol}: {pos.quantity} @ ₹{pos.avgPrice.toFixed(2)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div>
            <Leaderboard players={players} />
          </div>
        </div>
      </div>
    </div>
  )
}

