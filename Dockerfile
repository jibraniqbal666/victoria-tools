# Copy vmalert binary from vmalert container image
# Adjust VMALERT_IMAGE tag if needed (default: latest)
ARG VMALERT_IMAGE=victoriametrics/vmalert:latest
FROM ${VMALERT_IMAGE} AS vmalert-source

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY index.html ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy vmalert-prod binary from vmalert container
COPY --from=vmalert-source /vmalert-prod /usr/local/bin/vmalert
RUN chmod +x /usr/local/bin/vmalert && \
    echo "vmalert installed successfully:" && \
    vmalert --version

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server/index.js ./server/

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production
ENV VMALERT_PATH=/usr/local/bin/vmalert

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "server/index.js"]

