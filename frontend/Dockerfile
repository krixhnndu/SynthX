# syntax=docker/dockerfile:1.7
# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy manifests first — npm install layer only reruns when these change
COPY package*.json ./

# npm cache mount: downloaded packages are reused across builds
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy source last — only this layer rebuilds on code changes
COPY . .
RUN npm run build

# ─── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config — SPA fallback + proxy to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
