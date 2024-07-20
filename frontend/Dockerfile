# Development stage
FROM node:18-bookworm-slim AS development

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

ARG VITE_API_URL

RUN VITE_API_URL=${VITE_API_URL} npm run build

# Production stage
FROM caddy:2-alpine as production
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=development /app/dist /srv