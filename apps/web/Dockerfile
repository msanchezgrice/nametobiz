# BYPASS ALL PACKAGE MANAGEMENT - Pure Node.js deployment
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy ONLY the server file - no package.json to trigger detection
COPY server.js ./

# Create a minimal startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "🚀 Starting NametoBiz test server..."' >> start.sh && \
    echo 'node server.js' >> start.sh && \
    chmod +x start.sh

# Expose port
EXPOSE 3000

# Run the server directly
CMD ["./start.sh"] 