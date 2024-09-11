# Use the official Node.js image as the base
FROM node:18-alpine AS base

# Set the working directory within the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Clean up any existing node_modules and build output
RUN rm -f package-lock.json pnpm-lock.yaml
RUN rm -rf node_modules .next

# Install dependencies
RUN npm install

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a smaller Node.js image for production
FROM node:18-alpine AS runner

# Set the working directory
WORKDIR /app

# Copy the built application and required files from the builder stage
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app will run on
EXPOSE 3000

# Start the Next.js application in production mode
CMD ["npm", "start"]
