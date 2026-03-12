#!/bin/bash

set -euo pipefail

SERVER_IP="8.148.255.174"
SERVER_USER="root"
SERVER_PASS="Lutiancheng1"
REMOTE_DIR="/root/share-platform"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15"

FRONTEND_PORT="${FRONTEND_PORT:-3010}"
BACKEND_PORT="${BACKEND_PORT:-3011}"
NEXT_PUBLIC_API_PORT="${NEXT_PUBLIC_API_PORT:-$BACKEND_PORT}"
NEXT_PUBLIC_WS_PORT="${NEXT_PUBLIC_WS_PORT:-$BACKEND_PORT}"
PLATFORM="${PLATFORM:-linux/amd64}"
SKIP_BUILD="${SKIP_BUILD:-0}"

BACKEND_IMAGE="share-platform-backend:deploy"
FRONTEND_IMAGE="share-platform-frontend:deploy"
IMAGE_ARCHIVE="/tmp/share-platform-images.tar"

cleanup() {
    rm -f .rsync_exclude "$IMAGE_ARCHIVE"
}

trap cleanup EXIT

echo "🚀 Starting deployment to $SERVER_IP..."

if [ "$SKIP_BUILD" != "1" ]; then
  echo "🔨 Building backend image locally for $PLATFORM..."
  docker buildx build \
    --platform "$PLATFORM" \
    --load \
    -t "$BACKEND_IMAGE" \
    ./packages/backend

  echo "🔨 Building frontend image locally for $PLATFORM..."
  docker buildx build \
    --platform "$PLATFORM" \
    --load \
    --build-arg NEXT_PUBLIC_API_PORT="$NEXT_PUBLIC_API_PORT" \
    --build-arg NEXT_PUBLIC_WS_PORT="$NEXT_PUBLIC_WS_PORT" \
    -t "$FRONTEND_IMAGE" \
    ./packages/frontend
else
  echo "⏭️  Skipping local image builds and reusing existing tags..."
fi

echo "📦 Exporting images..."
docker save -o "$IMAGE_ARCHIVE" "$BACKEND_IMAGE" "$FRONTEND_IMAGE"

echo "📁 Creating remote directory..."
sshpass -p "$SERVER_PASS" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "mkdir -p '$REMOTE_DIR' '$REMOTE_DIR/uploads'"

echo "📤 Syncing project files..."
cat > .rsync_exclude <<EOF
node_modules
.git
.next
dist
.DS_Store
.env
deploy.sh
EOF

sshpass -p "$SERVER_PASS" rsync -avz \
  --exclude-from='.rsync_exclude' \
  -e "ssh $SSH_OPTS" \
  . "$SERVER_USER@$SERVER_IP:$REMOTE_DIR"

echo "📤 Uploading Docker images..."
sshpass -p "$SERVER_PASS" rsync -avz \
  -e "ssh $SSH_OPTS" \
  "$IMAGE_ARCHIVE" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

echo "🐳 Loading images and starting containers..."
sshpass -p "$SERVER_PASS" ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" <<EOF
set -euo pipefail
cd "$REMOTE_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=\$(openssl rand -hex 32)/" .env
  sed -i "s/ACCESS_PASSWORD=.*/ACCESS_PASSWORD=admin123/" .env
fi

set_env() {
  local key="\$1"
  local value="\$2"
  if grep -q "^\${key}=" .env; then
    sed -i "s|^\${key}=.*|\${key}=\${value}|" .env
  else
    echo "\${key}=\${value}" >> .env
  fi
}

set_env FRONTEND_PORT "$FRONTEND_PORT"
set_env BACKEND_PORT "$BACKEND_PORT"
set_env NEXT_PUBLIC_API_PORT "$NEXT_PUBLIC_API_PORT"
set_env NEXT_PUBLIC_WS_PORT "$NEXT_PUBLIC_WS_PORT"

docker load -i "$(basename "$IMAGE_ARCHIVE")"
rm -f "$(basename "$IMAGE_ARCHIVE")"

docker compose down
docker compose up -d --no-build
EOF

echo "✅ Deployment completed!"
echo "🌍 Frontend: http://$SERVER_IP:$FRONTEND_PORT"
echo "🔌 Backend:  http://$SERVER_IP:$BACKEND_PORT/api/messages"
