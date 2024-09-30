/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false, //TODO change to true
  staticPageGenerationTimeout: 500,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      }
    ],

    minimumCacheTTL: 60, // Minimum cache time in seconds (e.g., 1 minute)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Common device widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Sizes for generated images
  }
}

export default nextConfig
