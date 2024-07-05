# Build stage
FROM node:18-bookworm-slim as build

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build
