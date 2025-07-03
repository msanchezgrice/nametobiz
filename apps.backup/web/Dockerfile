# Use Node.js 20 Alpine
FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files first (from root context)
COPY apps/web/package.deploy.json ./package.json
COPY apps/web/.npmrc ./

# Verify no pnpm files are present
RUN ls -la / && ls -la /app && echo "Checking for pnpm files..." && find / -name "pnpm*" 2>/dev/null || echo "No pnpm files found"

# Install dependencies with npm
RUN npm install

# Copy all source files (from root context)
COPY apps/web/ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Start the application
CMD ["npm", "start"] 