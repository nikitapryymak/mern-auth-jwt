# Development stage
FROM node:18-bookworm-slim AS development

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN VITE_API_URL=https://api.auth.localhost npm run build

# Production stage
FROM node:18-bookworm-slim AS production

WORKDIR /app

COPY --from=development /app/dist ./dist