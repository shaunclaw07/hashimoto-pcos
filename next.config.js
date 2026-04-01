/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
