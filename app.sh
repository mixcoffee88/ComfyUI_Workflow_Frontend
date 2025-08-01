#!/bin/bash

APP_NAME="ComfyUI_Workflow_Frontend"
APP_DIR="/c/workspace/create_iamge_project/ComfyUI_Workflow_Frontend"
NODE_DIR="$APP_DIR/node_modules"
NPM="npm"
LOGFILE="$APP_DIR/server.log"
PIDFILE="$APP_DIR/npm.pid"
HOST="0.0.0.0"
PORT="9000"

start() {
  echo "▶ Starting $APP_NAME..."
  cd $APP_DIR
  
  # Check if node_modules exists, if not install dependencies
  if [ ! -d "$NODE_DIR" ]; then
    echo "📦 Installing dependencies..."
    $NPM install
  fi
  
  nohup $NPM run dev -- --host $HOST --port $PORT > "$LOGFILE" 2>&1 &
  echo $! > "$PIDFILE"
  echo "✅ Started with PID $(cat $PIDFILE)"
}

stop() {
  echo "⏹ Stopping $APP_NAME..."
  if [ -f "$PIDFILE" ]; then
    kill -9 $(cat "$PIDFILE") && rm -f "$PIDFILE"
    echo "✅ Stopped"
  else
    echo "⚠️ PID file not found"
  fi
}

restart() {
  echo "🔄 Restarting $APP_NAME..."
  stop
  sleep 1
  start
}

git_pull() {
  echo "🔄 Git pulling..."
  cd $APP_DIR
  git pull origin main
}

status() {
  if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p $PID > /dev/null; then
      echo "✅ $APP_NAME is running (PID: $PID)"
    else
      echo "⚠️ $APP_NAME is not running (stale PID file)"
      rm -f "$PIDFILE"
    fi
  else
    echo "❌ $APP_NAME is not running"
  fi
}

logs() {
  if [ -f "$LOGFILE" ]; then
    tail -f "$LOGFILE"
  else
    echo "⚠️ Log file not found"
  fi
}

install() {
  echo "📦 Installing dependencies..."
  cd $APP_DIR
  $NPM install
}

build() {
  echo "🔨 Building for production..."
  cd $APP_DIR
  $NPM run build
}

case "$1" in
  start) start ;;
  stop) stop ;;
  restart) restart ;;
  status) status ;;
  logs) logs ;;
  install) install ;;
  build) build ;;
  pull|git-pull) git_pull ;;
  *) echo "Usage: $0 {start|stop|restart|status|logs|install|build|pull}" ;;
esac 