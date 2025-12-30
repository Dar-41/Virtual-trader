# Deployment Guide

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variable:
   - `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url.railway.app`
6. Click "Deploy"

### Step 3: Update Backend CORS

After deployment, update `backend/server.js` CORS origin to include your Vercel URL.

## Backend Deployment (Railway)

### Step 1: Prepare for Railway

1. Create `railway.json` in backend folder:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `backend`
5. Add Environment Variables:
   - `PORT` = `3001` (or Railway will assign automatically)
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app`
   - `NODE_ENV` = `production`
6. Railway will automatically deploy

### Step 3: Get Backend URL

1. Go to your Railway project
2. Click on the service
3. Copy the generated URL (e.g., `https://your-app.railway.app`)
4. Update frontend environment variable with this URL

## Backend Deployment (Render)

### Alternative to Railway

1. Go to [render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: virtual-trader-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Root Directory**: `backend`
5. Add Environment Variables:
   - `PORT` = `3001`
   - `FRONTEND_URL` = `https://your-frontend-url.vercel.app`
   - `NODE_ENV` = `production`
6. Click "Create Web Service"

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Frontend environment variable points to backend URL
- [ ] Backend CORS allows frontend origin
- [ ] Health check endpoint works: `https://your-backend-url/health`
- [ ] Test room creation and joining
- [ ] Test game flow end-to-end

## Production Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
```

### Backend (Railway/Render)
```
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
- Check that backend CORS configuration includes your frontend URL

### Socket Connection Issues
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Check that backend is running and accessible
- Ensure WebSocket connections are not blocked by firewall

### Build Errors
- Ensure all dependencies are in `package.json`
- Check Node.js version compatibility (18+)
- Review build logs for specific errors

