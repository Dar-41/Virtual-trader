# Virtual Trader - Multiplayer Indian Stock Market Trading Game

A production-ready multiplayer trading game web app focused on the Indian stock market, designed for front-page demos, college fests, and workshops.

## Features

- **5-minute live trading sessions** with 2-10 players
- **Real-time candlestick charts** using TradingView Lightweight Charts
- **Multiple market scenarios**: Bullish, Bearish, Range-bound, High Volatility
- **Full admin panel** with game controls and real-time monitoring
- **Live leaderboard** with P&L, ROI, and trade statistics
- **QR code generation** for easy room joining
- **Projector mode** for fullscreen leaderboard display

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TradingView Lightweight Charts
- **Backend**: Node.js, Express, Socket.io
- **Real-time**: WebSockets for instant updates
- **State Management**: In-memory (can be upgraded to Redis)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd virtual-trader
```

2. Install root dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

5. Set up environment variables:

Create `backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Running Locally

1. Start both frontend and backend:
```bash
npm run dev
```

Or run separately:

Frontend (Terminal 1):
```bash
cd frontend
npm run dev
```

Backend (Terminal 2):
```bash
cd backend
npm run dev
```

2. Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Game Flow

1. **Admin creates a room** at `/admin`
   - Selects 1-3 Indian stocks
   - Chooses market scenario
   - Gets a room code

2. **Players join** using the room code
   - Enter name and room code
   - Auto-assigned ₹5,00,000 virtual balance

3. **Admin starts the game**
   - Market runs for exactly 5 minutes
   - Real-time price ticks every 500ms
   - Candles form every 5 seconds

4. **Players trade**
   - Buy, Sell, or Short sell
   - Market orders only, instant execution
   - See live P&L and positions

5. **Game ends**
   - Auto square-off all positions
   - Final leaderboard with rankings

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_SOCKET_URL` to your backend URL
4. Deploy

### Backend (Railway/Render)

1. Connect your GitHub repository
2. Set environment variables:
   - `PORT=3001`
   - `FRONTEND_URL=https://your-frontend-url.vercel.app`
   - `NODE_ENV=production`
3. Deploy

### Environment Variables

**Frontend (.env.local)**:
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.railway.app
```

**Backend (.env)**:
```
PORT=3001
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

## Project Structure

```
virtual-trader/
├── frontend/
│   ├── app/
│   │   ├── admin/          # Admin panel
│   │   ├── game/[roomCode] # Player game interface
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── Chart.tsx       # TradingView chart component
│   │   └── Leaderboard.tsx # Leaderboard component
│   ├── lib/
│   │   └── socket.ts       # Socket.io client
│   └── package.json
├── backend/
│   ├── server.js           # Express + Socket.io server
│   └── package.json
└── README.md
```

## Admin Panel Features

- Create rooms with custom stocks and scenarios
- Start/Pause/End game controls
- Inject volatility for dramatic moments
- View all player positions in real-time
- Live leaderboard updates
- Projector mode for fullscreen display

## Player Features

- Real-time candlestick charts
- Buy/Sell/Short sell orders
- Live portfolio tracking
- P&L and ROI calculations
- Position management
- Countdown timer

## Market Scenarios

- **Bullish**: Strong upward trend with positive momentum
- **Bearish**: Strong downward trend with negative momentum
- **Range-bound**: Sideways movement with low volatility
- **High Volatility**: Rapid price swings and spikes

## API Endpoints

- `GET /health` - Health check endpoint

## Socket.io Events

### Client → Server
- `admin:create-room` - Create a new game room
- `player:join` - Player joins a room
- `admin:start-game` - Start the game
- `admin:pause-game` - Pause the game
- `admin:end-game` - End the game
- `admin:inject-volatility` - Inject market volatility
- `trade:execute` - Execute a trade

### Server → Client
- `room:created` - Room created confirmation
- `player:joined` - Player joined confirmation
- `game:state` - Game state updates
- `market:tick` - Real-time price ticks
- `market:candle` - New candle formation
- `trade:executed` - Trade execution confirmation
- `leaderboard:update` - Leaderboard updates
- `timer:update` - Time remaining updates
- `game:end` - Game ended notification

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

