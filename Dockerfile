# ==============================================================================
# Multi-Stage Dockerfile for Atomic Habits (Production Vite + Nginx on Render)
# ==============================================================================

# Stage 1: Build the React Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Environment variables for build time (Can be passed from Render Dashboard)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build production bundle
RUN npm run build

# ==============================================================================
# Stage 2: Serve with Lightweight, High-Performance Nginx
# ==============================================================================
FROM nginx:alpine AS runner

# Copy custom Nginx configuration with SPA routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
