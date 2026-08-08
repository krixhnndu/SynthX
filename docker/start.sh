#!/usr/bin/env bash
set -euo pipefail

# Start the backend (uvicorn) and then run nginx in the foreground.
# The nginx config template uses ${PORT} for the listening port.

PORT=${PORT:-8080}

echo "Starting backend (uvicorn) on 127.0.0.1:8000"
# Run uvicorn in background; bind to 127.0.0.1 so nginx can proxy to it.
nohup uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --proxy-headers &

echo "Rendering nginx config from template (PORT=$PORT)"
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Starting nginx (foreground)"
nginx -g 'daemon off;'
