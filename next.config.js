/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/openfoodfacts/search',
        destination: 'https://world.openfoodfacts.org/cgi/search.pl',
      },
    ];
  },
};

module.exports = nextConfig;
