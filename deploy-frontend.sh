#!/bin/bash
set -e

SERVER="${SERVER:-root@38.54.4.112}"
PEM="${PEM:-prod-server-khmer-1.pem}"
REMOTE_DIR="${REMOTE_DIR:-/home/academy-kh/frontend}"
SERVICE="${SERVICE:-academy-kh-frontend}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-/etc/academy-kh/frontend.env}"
REMOTE_SERVICE_FILE="${REMOTE_SERVICE_FILE:-/etc/systemd/system/$SERVICE.service}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$SCRIPT_DIR/.env.production}"

env_file_value() {
  key="$1"
  shift
  for env_file in "$@"; do
    if [ -f "$env_file" ]; then
      value="$(grep -E "^${key}=" "$env_file" | tail -n 1 | cut -d= -f2- || true)"
      if [ -n "$value" ]; then
        printf '%s' "$value"
        return 0
      fi
    fi
  done
}

env_file_has_key() {
  key="$1"
  env_file="$2"
  [ -f "$env_file" ] && grep -q -E "^${key}=" "$env_file"
}

NEXT_PUBLIC_API_BASE_URL_PROVIDED="${NEXT_PUBLIC_API_BASE_URL+x}"
NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED="${NEXT_PUBLIC_TURNSTILE_SITE_KEY+x}"
API_INTERNAL_URL_PROVIDED="${API_INTERNAL_URL+x}"
FRONTEND_PORT_PROVIDED="${FRONTEND_PORT+x}"
PUBLIC_FRONTEND_URL_PROVIDED="${PUBLIC_FRONTEND_URL+x}"

NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$(env_file_value NEXT_PUBLIC_API_BASE_URL "$FRONTEND_DIR/.env.production" "$DEPLOY_ENV_FILE")}"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-$(env_file_value NEXT_PUBLIC_TURNSTILE_SITE_KEY "$FRONTEND_DIR/.env.production" "$DEPLOY_ENV_FILE" "$SCRIPT_DIR/.env" "$FRONTEND_DIR/.env.local")}"
API_INTERNAL_URL="${API_INTERNAL_URL:-$(env_file_value API_INTERNAL_URL "$FRONTEND_DIR/.env.production" "$DEPLOY_ENV_FILE")}"
FRONTEND_PORT="${FRONTEND_PORT:-$(env_file_value FRONTEND_PORT "$FRONTEND_DIR/.env.production" "$DEPLOY_ENV_FILE")}"
PUBLIC_FRONTEND_URL="${PUBLIC_FRONTEND_URL:-$(env_file_value PUBLIC_FRONTEND_URL "$FRONTEND_DIR/.env.production" "$DEPLOY_ENV_FILE")}"

[ -z "$NEXT_PUBLIC_API_BASE_URL_PROVIDED" ] && { env_file_has_key NEXT_PUBLIC_API_BASE_URL "$FRONTEND_DIR/.env.production" || env_file_has_key NEXT_PUBLIC_API_BASE_URL "$DEPLOY_ENV_FILE"; } && NEXT_PUBLIC_API_BASE_URL_PROVIDED=1
[ -z "$NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED" ] && { env_file_has_key NEXT_PUBLIC_TURNSTILE_SITE_KEY "$FRONTEND_DIR/.env.production" || env_file_has_key NEXT_PUBLIC_TURNSTILE_SITE_KEY "$DEPLOY_ENV_FILE"; } && NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED=1
[ -z "$API_INTERNAL_URL_PROVIDED" ] && { env_file_has_key API_INTERNAL_URL "$FRONTEND_DIR/.env.production" || env_file_has_key API_INTERNAL_URL "$DEPLOY_ENV_FILE"; } && API_INTERNAL_URL_PROVIDED=1
[ -z "$FRONTEND_PORT_PROVIDED" ] && { env_file_has_key FRONTEND_PORT "$FRONTEND_DIR/.env.production" || env_file_has_key FRONTEND_PORT "$DEPLOY_ENV_FILE"; } && FRONTEND_PORT_PROVIDED=1
[ -z "$PUBLIC_FRONTEND_URL_PROVIDED" ] && { env_file_has_key PUBLIC_FRONTEND_URL "$FRONTEND_DIR/.env.production" || env_file_has_key PUBLIC_FRONTEND_URL "$DEPLOY_ENV_FILE"; } && PUBLIC_FRONTEND_URL_PROVIDED=1

NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-https://academykh.jaekjay.com}"
API_INTERNAL_URL="${API_INTERNAL_URL:-http://localhost:8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
PUBLIC_FRONTEND_URL="${PUBLIC_FRONTEND_URL:-https://academykh.jaekjay.com}"

if [ ! -f "$PEM" ] && [ -f "$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem" ]; then
  PEM="$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem"
fi

if [ ! -f "$PEM" ]; then
  echo "PEM file not found: $PEM"
  echo "Set PEM=/path/to/prod-server-khmer-1.pem and run again."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$FRONTEND_DIR"
  npm ci
fi

echo "Building frontend..."
cd "$FRONTEND_DIR"
NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" NEXT_PUBLIC_TURNSTILE_SITE_KEY="$NEXT_PUBLIC_TURNSTILE_SITE_KEY" npm run build

STAGE_DIR="$(mktemp -d)"
ARCHIVE="$(mktemp -t academy-kh-frontend.XXXXXX.tar.gz)"

cp -R "$FRONTEND_DIR/.next/standalone/." "$STAGE_DIR/"
mkdir -p "$STAGE_DIR/.next"
cp -R "$FRONTEND_DIR/.next/static" "$STAGE_DIR/.next/static"
if [ -d "$FRONTEND_DIR/public" ]; then
  cp -R "$FRONTEND_DIR/public" "$STAGE_DIR/public"
fi

tar -czf "$ARCHIVE" -C "$STAGE_DIR" .
rm -rf "$STAGE_DIR"

echo "Deploying frontend to $SERVER:$REMOTE_DIR..."
ssh -i "$PEM" "$SERVER" "mkdir -p '$REMOTE_DIR'"
scp -i "$PEM" "$ARCHIVE" "$SERVER:/tmp/academy-kh-frontend.tar.gz"
rm -f "$ARCHIVE"

ssh -i "$PEM" "$SERVER" "rm -rf '$REMOTE_DIR'/* '$REMOTE_DIR'/.next '$REMOTE_DIR'/public && tar -xzf /tmp/academy-kh-frontend.tar.gz -C '$REMOTE_DIR' && rm -f /tmp/academy-kh-frontend.tar.gz"

echo "Creating frontend service on server if missing..."
REMOTE_ENV_ARGS=(
  "REMOTE_DIR=$REMOTE_DIR"
  "SERVICE=$SERVICE"
  "REMOTE_ENV_FILE=$REMOTE_ENV_FILE"
  "REMOTE_SERVICE_FILE=$REMOTE_SERVICE_FILE"
  "API_INTERNAL_URL=$API_INTERNAL_URL"
  "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL"
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  "FRONTEND_PORT=$FRONTEND_PORT"
  "NEXT_PUBLIC_API_BASE_URL_PROVIDED=$NEXT_PUBLIC_API_BASE_URL_PROVIDED"
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED=$NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED"
  "API_INTERNAL_URL_PROVIDED=$API_INTERNAL_URL_PROVIDED"
  "FRONTEND_PORT_PROVIDED=$FRONTEND_PORT_PROVIDED"
)
ssh -i "$PEM" "$SERVER" "$(printf '%q ' "${REMOTE_ENV_ARGS[@]}") bash -s" <<'REMOTE_SCRIPT'
set -e

set_env_value() {
  key="$1"
  value="$2"
  tmp_file="$(mktemp)"
  if [ -f "$REMOTE_ENV_FILE" ]; then
    grep -v "^${key}=" "$REMOTE_ENV_FILE" > "$tmp_file" || true
  fi
  printf '%s=%s\n' "$key" "$value" >> "$tmp_file"
  cat "$tmp_file" > "$REMOTE_ENV_FILE"
  rm -f "$tmp_file"
}

set_env_if_missing_or_provided() {
  key="$1"
  value="$2"
  provided="$3"
  existing_value=""
  if [ -f "$REMOTE_ENV_FILE" ]; then
    existing_value="$(grep -E "^${key}=" "$REMOTE_ENV_FILE" | tail -n 1 | cut -d= -f2- || true)"
  fi
  if [ -z "$provided" ] && [ -z "$value" ]; then
    return
  fi
  if [ -n "$provided" ] || ! grep -q "^${key}=" "$REMOTE_ENV_FILE" || { [ -n "$value" ] && [ -z "$existing_value" ]; }; then
    set_env_value "$key" "$value"
  fi
}

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  echo "Node.js is not installed on the server."
  echo "Install Node.js, then run deploy again."
  exit 1
fi

mkdir -p "$(dirname "$REMOTE_ENV_FILE")"
if [ ! -f "$REMOTE_ENV_FILE" ]; then
  touch "$REMOTE_ENV_FILE"
  chmod 600 "$REMOTE_ENV_FILE"
  echo "Created $REMOTE_ENV_FILE"
fi

set_env_if_missing_or_provided PORT "$FRONTEND_PORT" "$FRONTEND_PORT_PROVIDED"
set_env_if_missing_or_provided API_INTERNAL_URL "$API_INTERNAL_URL" "$API_INTERNAL_URL_PROVIDED"
set_env_if_missing_or_provided NEXT_PUBLIC_API_BASE_URL "$NEXT_PUBLIC_API_BASE_URL" "$NEXT_PUBLIC_API_BASE_URL_PROVIDED"
set_env_if_missing_or_provided NEXT_PUBLIC_TURNSTILE_SITE_KEY "$NEXT_PUBLIC_TURNSTILE_SITE_KEY" "$NEXT_PUBLIC_TURNSTILE_SITE_KEY_PROVIDED"

if [ ! -f "$REMOTE_SERVICE_FILE" ]; then
  cat > "$REMOTE_SERVICE_FILE" <<SERVICE_FILE
[Unit]
Description=Academy KH Next.js Frontend
After=network.target

[Service]
WorkingDirectory=$REMOTE_DIR
EnvironmentFile=$REMOTE_ENV_FILE
ExecStart=$NODE_BIN $REMOTE_DIR/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE_FILE
  systemctl daemon-reload
  systemctl enable "$SERVICE"
  echo "Created $REMOTE_SERVICE_FILE"
fi
REMOTE_SCRIPT

echo "Restarting frontend service on server..."
ssh -i "$PEM" "$SERVER" "systemctl daemon-reload && systemctl restart '$SERVICE' && systemctl --no-pager --full status '$SERVICE'"

echo "Done."
echo "Frontend should be available at: $PUBLIC_FRONTEND_URL"
