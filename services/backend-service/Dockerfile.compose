FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD [ "node", "dist/index.js" ]
