/**
 * Fonte única dos domínios aceitos para imagens de produtos.
 *
 * O `next/image` só exibe imagens de hosts liberados em `next.config.ts`; uma
 * URL fora da lista derruba a página. Por isso o mesmo conjunto alimenta os
 * `remotePatterns` e a validação do `imageUrl` na criação de produtos.
 */

export const PRODUCT_IMAGES_BUCKET = 'product-images';

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type ProductImageType = keyof typeof PRODUCT_IMAGE_TYPES;

export type RemoteImagePattern = {
  hostname: string;
  /** Prefixo do caminho; `/**` no final aceita qualquer subcaminho. */
  pathname?: string;
};

/**
 * Hosts de imagem de produto: seed (Unsplash), importação do n8n e o bucket do
 * Supabase Storage, onde ficam as imagens enviadas pelo formulário.
 */
export function getProductImagePatterns(
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): RemoteImagePattern[] {
  const patterns: RemoteImagePattern[] = [
    { hostname: 'images.unsplash.com' },
    { hostname: 'brazil.nothingprojector.com', pathname: '/cdn/shop/**' },
  ];

  if (supabaseUrl) {
    patterns.push({
      hostname: new URL(supabaseUrl).hostname,
      pathname: `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/**`,
    });
  }

  return patterns;
}

function matchesPath(path: string, pattern: string): boolean {
  return pattern.endsWith('/**') ? path.startsWith(pattern.slice(0, -2)) : path === pattern;
}

/** URL `https` cujo host (e caminho, quando definido) está na lista. */
export function isAllowedProductImageUrl(
  value: string,
  patterns: RemoteImagePattern[] = getProductImagePatterns(),
): boolean {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return (
    url.protocol === 'https:' &&
    patterns.some(
      (pattern) =>
        url.hostname === pattern.hostname &&
        (!pattern.pathname || matchesPath(url.pathname, pattern.pathname)),
    )
  );
}
