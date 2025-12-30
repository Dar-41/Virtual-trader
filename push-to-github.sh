#!/bin/bash

# GitHub Push Script for Virtual Trader
# Usage: ./push-to-github.sh YOUR_GITHUB_REPO_URL

if [ -z "$1" ]; then
  echo "❌ Error: Please provide your GitHub repository URL"
  echo ""
  echo "Usage: ./push-to-github.sh https://github.com/yourusername/virtual-trader.git"
  echo ""
  echo "Or create a repo first:"
  echo "1. Go to https://github.com/new"
  echo "2. Create a new repository (don't initialize with README)"
  echo "3. Copy the repository URL"
  echo "4. Run: ./push-to-github.sh YOUR_REPO_URL"
  exit 1
fi

REPO_URL=$1

echo "🚀 Pushing to GitHub..."
echo "Repository: $REPO_URL"
echo ""

cd "$(dirname "$0")"

# Add remote (remove if exists)
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

# Set main branch
git branch -M main

# Push to GitHub
echo "📤 Pushing code to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "🌐 View your repo at: $REPO_URL"
else
  echo ""
  echo "❌ Push failed. Make sure:"
  echo "   - The repository URL is correct"
  echo "   - You have access to the repository"
  echo "   - You're authenticated with GitHub (git credential helper)"
fi

