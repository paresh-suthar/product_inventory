#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================="
echo "   StockFlow Server & Financial ERP - Dev Environment    "
echo "========================================================="

# 1. Check Python virtualenv
if [ ! -d "$PROJECT_ROOT/backend/venv" ]; then
    echo "Creating Python virtual environment in backend/venv..."
    python3 -m venv "$PROJECT_ROOT/backend/venv"
fi

echo "Installing backend dependencies..."
"$PROJECT_ROOT/backend/venv/bin/pip" install --quiet -r "$PROJECT_ROOT/backend/requirements.txt"

echo "Seeding database with initial data..."
PYTHONPATH="$PROJECT_ROOT/backend" "$PROJECT_ROOT/backend/venv/bin/python" "$PROJECT_ROOT/backend/app/seed.py"

# 2. Check Frontend node_modules
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$PROJECT_ROOT/frontend" && npm install
fi

echo ""
echo "🚀 Launching FastAPI Backend on http://localhost:8000"
echo "🚀 Launching React Frontend on http://localhost:5173"
echo "========================================================="
echo "Default Admin: admin@stockflow.internal / admin123"
echo "========================================================="

# Start backend in background
cd "$PROJECT_ROOT/backend"
"$PROJECT_ROOT/backend/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd "$PROJECT_ROOT/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# Trap signals and kill child processes on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

wait
