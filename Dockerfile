# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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

# Set environment variables from build arguments
ARG _NEXT_PUBLIC_PROJECT_ID
ARG _NEXT_PUBLIC_VERTEX_API_LOCATION
ARG _NEXT_PUBLIC_GCS_BUCKET_LOCATION
ARG _NEXT_PUBLIC_GEMINI_MODEL
ARG _NEXT_PUBLIC_SEG_MODEL
ARG _NEXT_PUBLIC_EDIT_ENABLED
ARG _NEXT_PUBLIC_VEO_ENABLED
ARG _NEXT_PUBLIC_VEO_ITV_ENABLED
ARG _NEXT_PUBLIC_VEO_ADVANCED_ENABLED
ARG _NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS
ARG _NEXT_PUBLIC_OUTPUT_BUCKET
ARG _NEXT_PUBLIC_TEAM_BUCKET
ARG _NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI
ENV NEXT_PUBLIC_PROJECT_ID=$_NEXT_PUBLIC_PROJECT_ID \
  NEXT_PUBLIC_VERTEX_API_LOCATION=$_NEXT_PUBLIC_VERTEX_API_LOCATION \
  NEXT_PUBLIC_GCS_BUCKET_LOCATION=$_NEXT_PUBLIC_GCS_BUCKET_LOCATION \
  NEXT_PUBLIC_GEMINI_MODEL=$_NEXT_PUBLIC_GEMINI_MODEL \
  NEXT_PUBLIC_SEG_MODEL=$_NEXT_PUBLIC_SEG_MODEL \
  NEXT_PUBLIC_EDIT_ENABLED=$_NEXT_PUBLIC_EDIT_ENABLED \
  NEXT_PUBLIC_VEO_ENABLED=$_NEXT_PUBLIC_VEO_ENABLED \
  NEXT_PUBLIC_VEO_ITV_ENABLED=$_NEXT_PUBLIC_VEO_ITV_ENABLED \
  NEXT_PUBLIC_VEO_ADVANCED_ENABLED=$_NEXT_PUBLIC_VEO_ADVANCED_ENABLED \
  NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS=$_NEXT_PUBLIC_PRINCIPAL_TO_USER_FILTERS \
  NEXT_PUBLIC_OUTPUT_BUCKET=$_NEXT_PUBLIC_OUTPUT_BUCKET \
  NEXT_PUBLIC_TEAM_BUCKET=$_NEXT_PUBLIC_TEAM_BUCKET \
  NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI=$_NEXT_PUBLIC_EXPORT_FIELDS_OPTIONS_URI

# Build the Next.js application
RUN npm run build

# Use a smaller Node.js image for production
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Install ffmpeg using Alpine's package manager
# This ensures that ffmpeg and its required shared libraries are present.
# It's important for running the ffmpeg binary that @ffmpeg-installer/ffmpeg provides.
USER root
RUN apk update && apk add --no-cache ffmpeg
USER node

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
