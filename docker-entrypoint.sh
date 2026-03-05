#!/bin/sh
set -e

echo "🎬 Starting CineWeb..."

# Start Express backend in background
echo "   → Starting API server on port 3001..."
cd /app/server
node server.js &
API_PID=$!

# Wait for API to be ready
for i in $(seq 1 30); do
  if wget -q -O /dev/null http://127.0.0.1:3001/api/health 2>/dev/null; then
    echo "   ✅ API server ready"
    break
  fi
  sleep 1
done

# Start Nginx in foreground
echo "   → Starting Nginx on port 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "   ✅ CineWeb is live!"

# Wait for either process to exit
wait -n $API_PID $NGINX_PID
exit $?
