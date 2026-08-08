# Multi-stage Dockerfile to build frontend and backend and run both in one container
# Frontend is built with Node/Vite and copied into nginx's html dir.
# Uvicorn runs the FastAPI app on an internal port; nginx listens on $PORT and
# proxies API and websocket requests to the backend.

#############################
# Frontend build
#############################
FROM node:20-alpine AS frontend-build
WORKDIR /tmp/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

#############################
# Final image
#############################
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system deps: nginx and build tools for Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential gcc libpq-dev ca-certificates nginx gettext-base && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend sources
COPY backend/ ./backend/

# Install Python deps
RUN pip install --no-cache-dir -r backend/requirements.txt uvicorn

# Copy built frontend into nginx html dir
COPY --from=frontend-build /tmp/frontend/dist /usr/share/nginx/html

# Nginx config template and startup script
COPY docker/nginx.default.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8080

ENV PORT=8080

CMD ["/app/start.sh"]
