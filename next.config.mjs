/** @type {import('next').NextConfig} */

const nextConfig = { reactStrictMode: true, staticPageGenerationTimeout: 120,images: { domains: ['storage.googleapis.com'], formats: ['image/avif', 'image/webp'], }, }

export default nextConfig;
