'use client'

interface Player {
  id: string
  name: string
  balance: number
  pnl: number
  roi: number
  trades: number
}

interface LeaderboardProps {
  players: Player[]
  isProjectorMode?: boolean
}

export default function Leaderboard({ players, isProjectorMode = false }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.pnl - a.pnl)

  return (
    <div className={`bg-white rounded-lg shadow-lg ${isProjectorMode ? 'p-8' : 'p-4'}`}>
      <h2 className={`font-bold mb-4 ${isProjectorMode ? 'text-3xl' : 'text-xl'}`}>
        Leaderboard
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className={`text-left py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>Rank</th>
              <th className={`text-left py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>Name</th>
              <th className={`text-right py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>Balance</th>
              <th className={`text-right py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>P&L</th>
              <th className={`text-right py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>ROI</th>
              <th className={`text-right py-2 ${isProjectorMode ? 'text-xl' : 'text-sm'} font-semibold`}>Trades</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => (
              <tr
                key={player.id}
                className={`border-b border-gray-100 ${
                  index === 0 ? 'bg-yellow-50 font-semibold' : ''
                }`}
              >
                <td className={`py-3 ${isProjectorMode ? 'text-lg' : 'text-sm'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </td>
                <td className={`py-3 ${isProjectorMode ? 'text-lg' : 'text-sm'} font-medium`}>
                  {player.name}
                </td>
                <td className={`text-right py-3 ${isProjectorMode ? 'text-lg' : 'text-sm'}`}>
                  ₹{player.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`text-right py-3 font-semibold ${
                    player.pnl >= 0 ? 'text-profit' : 'text-loss'
                  } ${isProjectorMode ? 'text-lg' : 'text-sm'}`}
                >
                  {player.pnl >= 0 ? '+' : ''}
                  ₹{player.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`text-right py-3 font-semibold ${
                    player.roi >= 0 ? 'text-profit' : 'text-loss'
                  } ${isProjectorMode ? 'text-lg' : 'text-sm'}`}
                >
                  {player.roi >= 0 ? '+' : ''}
                  {player.roi.toFixed(2)}%
                </td>
                <td className={`text-right py-3 ${isProjectorMode ? 'text-lg' : 'text-sm'}`}>
                  {player.trades}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

