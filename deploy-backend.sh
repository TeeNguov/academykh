#!/bin/bash
set -e

SERVER="${SERVER:-root@38.54.4.112}"
PEM="${PEM:-prod-server-khmer-1.pem}"
REMOTE_DIR="${REMOTE_DIR:-/home/academy-kh/backend}"
SERVICE="${SERVICE:-academy-kh-backend}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-$REMOTE_DIR/.env.production}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-$BACKEND_DIR/.env.production}"

if [ ! -f "$PEM" ] && [ -f "$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem" ]; then
  PEM="$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem"
fi

if [ ! -f "$PEM" ]; then
  echo "PEM file not found: $PEM"
  echo "Set PEM=/path/to/prod-server-khmer-1.pem and run again."
  exit 1
fi

if [ ! -f "$LOCAL_ENV_FILE" ]; then
  echo "Backend production env file not found: $LOCAL_ENV_FILE"
  echo "Create backend/.env.production before deploying."
  exit 1
fi

env_file_value() {
  key="$1"
  env_file="$2"
  grep -E "^${key}=" "$env_file" | tail -n 1 | cut -d= -f2- || true
}

require_env_value() {
  key="$1"
  value="$(env_file_value "$key" "$LOCAL_ENV_FILE")"
  if [ -z "$value" ]; then
    echo "$LOCAL_ENV_FILE is missing a value for $key"
    exit 1
  fi
}

require_env_value DB_HOST
require_env_value DB_PORT
require_env_value DB_NAME
require_env_value DB_USERNAME
require_env_value DB_PASSWORD
require_env_value AUTH_COOKIE_SECRET

echo "Building backend..."
cd "$BACKEND_DIR"

if command -v mvn >/dev/null 2>&1; then
  mvn -DskipTests clean package
else
  echo "Local mvn not found. Building with Docker Maven image..."
  docker run --rm \
    -v "$BACKEND_DIR:/app" \
    -v "$HOME/.m2:/root/.m2" \
    -w /app \
    maven:3.9.9-eclipse-temurin-21 \
    mvn -DskipTests clean package
fi

JAR_FILE="$(find "$BACKEND_DIR/target" -maxdepth 1 -type f -name "*.jar" ! -name "*.original" | sort | tail -n 1)"

if [ -z "$JAR_FILE" ] || [ ! -f "$JAR_FILE" ]; then
  echo "Could not find built backend jar in $BACKEND_DIR/target"
  exit 1
fi

echo "Deploying backend to $SERVER:$REMOTE_DIR..."
ssh -i "$PEM" "$SERVER" "mkdir -p '$REMOTE_DIR'"
scp -i "$PEM" "$JAR_FILE" "$SERVER:$REMOTE_DIR/app.jar"
scp -i "$PEM" "$LOCAL_ENV_FILE" "$SERVER:$REMOTE_ENV_FILE"
ssh -i "$PEM" "$SERVER" "chmod 600 '$REMOTE_ENV_FILE'"

echo "Restarting service on server..."
ssh -i "$PEM" "$SERVER" "systemctl daemon-reload && systemctl restart '$SERVICE' && systemctl --no-pager --full status '$SERVICE'"

echo "Done."
