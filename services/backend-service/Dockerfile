FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies (including devDeps for build)
COPY services/backend-service/package*.json ./
RUN npm ci

# Copy sources and build
COPY services/backend-service/ ./
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

# Install only production dependencies
COPY services/backend-service/package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy static data into the image (marker-proof)
COPY Updated_Dublin_Bus_Static_Data /app/data

EXPOSE 3000
CMD ["node", "dist/index.js"]
