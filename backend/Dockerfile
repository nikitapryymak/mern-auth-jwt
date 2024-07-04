# Build stage
FROM node:18-bookworm-slim as build

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:18-bookworm-slim as production

WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

COPY --from=build /app/dist .

CMD ["node", "index.js"]