# --- Build Stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies (needed for compiling native addons like better-sqlite3 if needed)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package configurations
COPY package*.json ./

# Install all dependencies (development + production)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Run compilation
RUN npm run build

# --- Production Stage ---
FROM node:20-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Better-sqlite3 database file storage directory
ENV DATABASE_PATH=/app/data/archive.db

# Install system utilities needed for building runtime features (if any, e.g. ca-certificates for Gemini API)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package configurations
COPY package*.json ./

# Install only production dependencies (this includes better-sqlite3)
RUN npm ci --omit=dev

# Copy build artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create necessary persistent data directories
RUN mkdir -p /app/data /app/uploads

# Expose port
EXPOSE 3000

# Start app using the node runner on the compiled server file
CMD ["node", "dist/server.js"]
