/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pg'],
  },
  webpack: (config) => {
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig 