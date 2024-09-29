# Use the official Node.js image as the base
FROM node:20-alpine AS base

# Set the working directory within the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Copy export field file from GCS (fetched in cloudbuild.yaml)
COPY export-fields_options.ts /app/context/export-fields_options.ts

# Set environment variables from build arguments
ARG _PROJECT_ID
ARG _VERTEX_API_LOCATION
ARG _GCS_BUCKET_LOCATION
ARG _GEMINI_MODEL
ARG _NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS
ARG _NEXT_PUBLIC_OUTPUT_BUCKET
ARG _NEXT_PUBLIC_TEAM_BUCKET
ENV PROJECT_ID=$_PROJECT_ID \
    VERTEX_API_LOCATION=$_VERTEX_API_LOCATION \
    GCS_BUCKET_LOCATION=$_GCS_BUCKET_LOCATION \
    GEMINI_MODEL=$_GEMINI_MODEL \
    NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS=$_NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS \
    NEXT_PUBLIC_OUTPUT_BUCKET=$_NEXT_PUBLIC_OUTPUT_BUCKET \
    NEXT_PUBLIC_TEAM_BUCKET=$_NEXT_PUBLIC_TEAM_BUCKET

# Build the Next.js application
RUN npm run build

# Use a smaller Node.js image for production
FROM node:20-alpine AS runner

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
