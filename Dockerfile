# Use Node.js 22 Alpine for small size and recent security patches
FROM node:22-alpine

# Set to production environment
ENV NODE_ENV=production

# Install sqlite3 dependencies (python3, make, g++) if native build needed
# Pure JS sqlite or prebuilt binaries might not need this, but 'sqlite3' package often requires build tools on Alpine
# Installing python3/make/g++ just in case, removing later if possible to save space
# Actually, 'sqlite3' usually fetches pre-built bindings, but Alpine musl can be tricky.
# Let's try minimal first. If it fails, we add build-base.
# RUN apk add --no-cache python3 make g++

# Set working directory and permissions for 'node' user
WORKDIR /home/node/app
run mkdir -p /home/node/app && chown -R node:node /home/node/app

# Switch to non-root user
USER node

# Copy package files first
COPY --chown=node:node package*.json ./

# Install dependencies (Production only)
RUN npm ci --omit=dev

# Copy application source code
COPY --chown=node:node . .

# Expose the port
ENV PORT=7654
EXPOSE 7654

# Start application
CMD ["node", "index.js"]
