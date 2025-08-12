/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Uncomment for static export deployment
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // }
};

module.exports = withPWA(nextConfig);