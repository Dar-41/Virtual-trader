#!/bin/bash

echo "🚀 Setting up Virtual Trader..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create environment files if they don't exist
if [ ! -f "backend/.env" ]; then
  echo "📝 Creating backend/.env..."
  cat > backend/.env << EOF
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF
fi

if [ ! -f "frontend/.env.local" ]; then
  echo "📝 Creating frontend/.env.local..."
  cat > frontend/.env.local << EOF
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
EOF
fi

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Or run separately:"
echo "  Frontend: cd frontend && npm run dev"
echo "  Backend:  cd backend && npm run dev"

