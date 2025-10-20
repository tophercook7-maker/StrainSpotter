#!/bin/bash
# StrainSpotter - Fresh Start Script
# Kills all dev servers and restarts them cleanly

echo "🛑 Stopping all dev servers..."

# Kill frontend
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Kill backend
lsof -ti tcp:5181 | xargs -r kill 2>/dev/null
pkill -f "node index.js" 2>/dev/null

echo "⏳ Waiting 2 seconds..."
sleep 2

echo "🚀 Starting backend..."
cd /Users/christophercook/Projects/strainspotter/backend
node index.js > /tmp/strainspotter-backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 2

echo "🚀 Starting frontend..."
cd /Users/christophercook/Projects/strainspotter/frontend
npm run dev > /tmp/strainspotter-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Done! Servers starting..."
echo ""
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend:  http://localhost:5181"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/strainspotter-backend.log"
echo "   Frontend: tail -f /tmp/strainspotter-frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
