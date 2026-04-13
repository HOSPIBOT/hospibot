/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'chart.googleapis.com' },
    ],
  },
  // Fix duplicate React in monorepo (prevents useContext null errors on /404 /500)
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };
    return config;
  },
  // Transpile mobile package (part of monorepo) to prevent build errors
  transpilePackages: [],
};

module.exports = nextConfig;
