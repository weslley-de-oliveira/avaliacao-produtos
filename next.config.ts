import type { NextConfig } from 'next';
import { getProductImagePatterns } from './src/lib/images/product-images';

const nextConfig: NextConfig = {
  // O Mastra roda só no servidor e não deve ser empacotado pelo bundler.
  serverExternalPackages: ['@mastra/*'],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Avatares
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // Imagens de produtos: mesma lista usada para validar o `imageUrl`
      ...getProductImagePatterns().map(({ hostname, pathname }) => ({
        protocol: 'https' as const,
        hostname,
        ...(pathname ? { pathname } : {}),
      })),
    ],
  },
};

export default nextConfig;
