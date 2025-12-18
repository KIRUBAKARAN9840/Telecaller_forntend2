/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  experimental: {
    esmExternals: false
  },
  async rewrites() {
    const baseURL = 'https://erminia-mirthful-nonpatriotically.ngrok-free.dev';

    return [
      {
        source: '/api/:path*',
        destination: `${baseURL}/api/:path*`,
      },
      {
        source: '/telecaller/:path*',
        destination: `${baseURL}/telecaller/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;