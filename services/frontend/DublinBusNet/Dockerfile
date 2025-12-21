FROM node:20-alpine AS builder
WORKDIR /app

# Accept API base as build argument
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

# Install dependencies and build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runner

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config (must proxy /api to backend service OR just serve frontend if ingress handles routing)
COPY nginx/default.k8s.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
