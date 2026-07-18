/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: [],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/skills',
        destination: '/',
        permanent: true,
      },
      {
        source: '/practices',
        destination: '/?mode=practices',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
