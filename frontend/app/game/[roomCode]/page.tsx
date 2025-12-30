'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import { Time } from 'lightweight-charts'
import Chart from '@/components/Chart'
import Leaderboard from '@/components/Leaderboard'
import QRCode from 'react-qr-code'

interface Position {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
}

interface Player {
  id: string
  name: string
  balance: number
  pnl: number
  roi: number
  trades: number
}

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export default function GamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomCode = params.roomCode as string
  const playerName = searchParams.get('name') || 'Player'

  const [balance, setBalance] = useState(500000)
  const [positions, setPositions] = useState<Position[]>([])
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState(300)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'ended'>('waiting')
  const [players, setPlayers] = useState<Player[]>([])
  const [stocks, setStocks] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    const socket = connectSocket(roomCode, playerName)
    socketRef.current = socket

    socket.on('game:state', (state: any) => {
      setGameStatus(state.status)
      setTimeRemaining(state.timeRemaining)
      setStocks(state.stocks || [])
      if (state.stocks && state.stocks.length > 0 && !selectedSymbol) {
        setSelectedSymbol(state.stocks[0])
      }
      setIsAdmin(state.isAdmin || false)
    })

    socket.on('player:joined', (data: any) => {
      setBalance(data.balance)
      setPlayers(data.players || [])
    })

    socket.on('market:tick', (data: any) => {
      if (data.symbol === selectedSymbol) {
        setChartData((prev) => {
          const newData = [...prev]
          const lastCandle = newData[newData.length - 1]

          if (lastCandle && lastCandle.time === data.time) {
            lastCandle.high = Math.max(lastCandle.high, data.price)
            lastCandle.low = Math.min(lastCandle.low, data.price)
            lastCandle.close = data.price
            return [...newData]
          } else {
            return [
              ...newData,
              {
                time: data.time,
                open: data.price,
                high: data.price,
                low: data.price,
                close: data.price,
              },
            ]
          }
        })
      }

      // Update positions with new price
      setPositions((prev) =>
        prev.map((pos) =>
          pos.symbol === data.symbol
            ? {
              ...pos,
              currentPrice: data.price,
              pnl: (data.price - pos.avgPrice) * pos.quantity,
            }
            : pos
        )
      )
    })

    socket.on('market:candle', (data: any) => {
      if (data.symbol === selectedSymbol) {
        setChartData((prev) => [...prev, data])
      }
    })

    socket.on('trade:executed', (data: any) => {
      setBalance(data.balance)
      setPositions(data.positions || [])
    })

    socket.on('leaderboard:update', (data: Player[]) => {
      setPlayers(data)
      const myPlayer = data.find((p) => p.name === playerName)
      if (myPlayer) {
        setBalance(myPlayer.balance)
      }
    })

    socket.on('game:end', (data: any) => {
      setGameStatus('ended')
      setPlayers(data.leaderboard || [])
    })

    socket.on('timer:update', (time: number) => {
      setTimeRemaining(time)
    })

    return () => {
      disconnectSocket()
    }
  }, [roomCode, playerName, selectedSymbol])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrade = (type: 'buy' | 'sell' | 'short' | 'cover') => {
    if (!selectedSymbol || !quantity || gameStatus !== 'active') return

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) return

    const socket = getSocket()
    if (socket) {
      socket.emit('trade:execute', {
        roomCode,
        symbol: selectedSymbol,
        type,
        quantity: qty,
      })
      setQuantity('')
    }
  }

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
  const totalValue = balance + totalPnL

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Room: {roomCode}</h1>
            <p className="text-gray-600">Welcome, {playerName}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-600">
              {gameStatus === 'waiting' && 'Waiting to start...'}
              {gameStatus === 'active' && 'Game in progress'}
              {gameStatus === 'ended' && 'Game ended'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stock Selector */}
            {stocks.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-2">
                  {stocks.map((stock) => (
                    <button
                      key={stock}
                      onClick={() => setSelectedSymbol(stock)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedSymbol === stock
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {stock}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chart */}
            {selectedSymbol && (
              <Chart
                symbol={selectedSymbol}
                data={chartData.map((c) => ({
                  time: c.time as Time,
                  open: c.open,
                  high: c.high,
                  low: c.low,
                  close: c.close,
                }))}
              />
            )}

            {/* Trading Controls */}
            {gameStatus === 'active' && selectedSymbol && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Place Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                      min="1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleTrade('buy')}
                      className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => handleTrade('sell')}
                      className="bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                    >
                      Sell
                    </button>
                    <button
                      onClick={() => handleTrade('short')}
                      className="bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all"
                    >
                      Short
                    </button>
                    <button
                      onClick={() => handleTrade('cover')}
                      className="bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                    >
                      Cover
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Positions */}
            {positions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-xl font-bold mb-4">Open Positions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-2 text-sm font-semibold">Symbol</th>
                        <th className="text-right py-2 text-sm font-semibold">Qty</th>
                        <th className="text-right py-2 text-sm font-semibold">Avg Price</th>
                        <th className="text-right py-2 text-sm font-semibold">Current</th>
                        <th className="text-right py-2 text-sm font-semibold">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium">{pos.symbol}</td>
                          <td className="text-right py-2 text-sm">{pos.quantity}</td>
                          <td className="text-right py-2 text-sm">
                            ₹{pos.avgPrice.toFixed(2)}
                          </td>
                          <td className="text-right py-2 text-sm">
                            ₹{pos.currentPrice.toFixed(2)}
                          </td>
                          <td
                            className={`text-right py-2 text-sm font-semibold ${pos.pnl >= 0 ? 'text-profit' : 'text-loss'
                              }`}
                          >
                            {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Portfolio</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-semibold">
                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">P&L:</span>
                  <span
                    className={`font-semibold ${totalPnL >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                  >
                    {totalPnL >= 0 ? '+' : ''}
                    ₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-semibold">Total Value:</span>
                  <span
                    className={`font-bold text-lg ${totalPnL >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                  >
                    ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <Leaderboard players={players} />

            {/* QR Code */}
            {isAdmin && (
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <h3 className="font-bold mb-2">Room QR Code</h3>
                <div className="flex justify-center">
                  <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/game/${roomCode}`} />
                </div>
                <p className="text-sm text-gray-600 mt-2">Scan to join</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

