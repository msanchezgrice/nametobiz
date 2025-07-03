# Use Node.js 20 Alpine - minimal test deployment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json
COPY deploy-web/package.json ./

# Install dependencies (minimal, should be none)
RUN npm install

# Copy server
COPY deploy-web/server.js ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 