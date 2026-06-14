/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '2.24.98.43' },
      { protocol: 'https', hostname: '2.24.98.43' },
      { protocol: 'https', hostname: 'pietset.space' },
      { protocol: 'http',  hostname: 'pietset.space' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    unoptimized: true,
  },
}
module.exports = nextConfig
