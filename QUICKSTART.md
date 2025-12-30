# Quick Start Guide

## Installation (5 minutes)

1. **Clone and setup:**
```bash
cd "virtual trader"
chmod +x setup.sh
./setup.sh
```

Or manually:
```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

2. **Create environment files:**

`backend/.env`:
```
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

`frontend/.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

3. **Start the application:**
```bash
npm run dev
```

This starts both frontend (port 3000) and backend (port 3001).

## First Game (2 minutes)

1. **Open browser:** http://localhost:3000

2. **Create room (Admin):**
   - Click "Create Room (Admin)"
   - Select 1-3 stocks (e.g., RELIANCE, TCS)
   - Choose market scenario (Bullish, Bearish, Range, Volatile)
   - Note the Room Code (e.g., ABC123)

3. **Join as player:**
   - Open a new tab/window
   - Enter your name and the Room Code
   - Click "Join Game"

4. **Start game:**
   - In admin panel, click "Start Game"
   - Game runs for 5 minutes
   - Players can Buy/Sell/Short/Cover stocks

5. **Game ends:**
   - Auto square-off all positions
   - Leaderboard shows final rankings

## Testing with Multiple Players

1. Open multiple browser tabs/windows
2. Each tab = one player
3. All join the same room code
4. All see the same market prices in real-time

## Features to Test

- ✅ Real-time price updates (every 500ms)
- ✅ Candlestick chart formation (every 5 seconds)
- ✅ Buy/Sell/Short/Cover orders
- ✅ Live P&L calculation
- ✅ Leaderboard updates
- ✅ Admin controls (Start/Pause/End)
- ✅ Inject Volatility button
- ✅ Projector Mode for leaderboard
- ✅ QR Code for room joining

## Troubleshooting

**Socket connection fails:**
- Check backend is running on port 3001
- Verify `NEXT_PUBLIC_SOCKET_URL` in frontend/.env.local

**CORS errors:**
- Ensure `FRONTEND_URL` in backend/.env matches frontend URL

**Chart not showing:**
- Check browser console for errors
- Verify lightweight-charts is installed

**Trades not executing:**
- Check game status is "active"
- Verify sufficient balance
- Check browser console for errors

## Next Steps

- Deploy to production (see DEPLOYMENT.md)
- Customize market scenarios
- Add more Indian stocks
- Integrate with Firebase for persistence

