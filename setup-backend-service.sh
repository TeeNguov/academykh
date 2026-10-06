#!/bin/bash
set -e

SERVER="${SERVER:-root@38.54.4.112}"
PEM="${PEM:-prod-server-khmer-1.pem}"
REMOTE_DIR="${REMOTE_DIR:-/home/academy-kh/backend}"
SERVICE="${SERVICE:-academy-kh-backend}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-$REMOTE_DIR/.env.production}"
REMOTE_SERVICE_FILE="${REMOTE_SERVICE_FILE:-/etc/systemd/system/$SERVICE.service}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$PEM" ] && [ -f "$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem" ]; then
  PEM="$SCRIPT_DIR/../address-kh/prod-server-khmer-1.pem"
fi

if [ ! -f "$PEM" ]; then
  echo "PEM file not found: $PEM"
  echo "Set PEM=/path/to/prod-server-khmer-1.pem and run again."
  exit 1
fi

echo "Creating backend service file on $SERVER..."
REMOTE_ENV_ARGS=(
  "REMOTE_DIR=$REMOTE_DIR"
  "SERVICE=$SERVICE"
  "REMOTE_ENV_FILE=$REMOTE_ENV_FILE"
  "REMOTE_SERVICE_FILE=$REMOTE_SERVICE_FILE"
)
ssh -i "$PEM" "$SERVER" "$(printf '%q ' "${REMOTE_ENV_ARGS[@]}") bash -s" <<'REMOTE_SCRIPT'
set -e

mkdir -p "$REMOTE_DIR"

cat > "$REMOTE_SERVICE_FILE" <<SERVICE_FILE
[Unit]
Description=Academy KH Spring Boot Backend
After=network.target mysql.service

[Service]
WorkingDirectory=$REMOTE_DIR
EnvironmentFile=$REMOTE_ENV_FILE
ExecStart=/usr/bin/java -jar $REMOTE_DIR/app.jar
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
SERVICE_FILE

systemctl daemon-reload
systemctl enable "$SERVICE"
echo "Created $REMOTE_SERVICE_FILE"
REMOTE_SCRIPT

echo "Done."
