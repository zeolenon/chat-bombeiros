/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pg'],
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
  // Configurações para upload de arquivos grandes
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
  // Configurações adicionais para timeouts
  serverRuntimeConfig: {
    // Timeout para uploads (5 minutos)
    uploadTimeout: 300000,
  },
  // Configurações para melhor performance com arquivos grandes
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pg'],
    // Otimizações para arquivos grandes
    optimizePackageImports: ['pdf-parse'],
  },
}

module.exports = nextConfig 