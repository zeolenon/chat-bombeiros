/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pg'],
    // Otimizações para arquivos grandes
    optimizePackageImports: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    // Configuração para pdf-parse
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });

    // Configuração para undici - excluir do processamento do webpack
    if (isServer) {
      config.externals.push({
        'undici': 'commonjs undici',
      });
    }

    // Configuração para evitar processamento do undici
    config.resolve.fallback = {
      ...config.resolve.fallback,
      undici: false,
    };

    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Configurações para upload de arquivos grandes no App Router
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Configurações para timeouts e limites de tamanho
  serverRuntimeConfig: {
    // Timeout para uploads (5 minutos)
    uploadTimeout: 300000,
    // Tamanho máximo do corpo da requisição (50MB)
    maxBodySize: '50mb',
  },
}

module.exports = nextConfig 