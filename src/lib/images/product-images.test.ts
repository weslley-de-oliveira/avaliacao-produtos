import { describe, expect, it } from 'vitest';
import { createProductSchema } from '@/lib/validations/product';
import { getProductImagePatterns, isAllowedProductImageUrl } from './product-images';

const supabaseUrl = 'https://abcxyz.supabase.co';
const patterns = getProductImagePatterns(supabaseUrl);
const storageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/products/a1.webp`;

describe('isAllowedProductImageUrl', () => {
  it.each([
    'https://images.unsplash.com/photo-123?w=1200',
    'https://brazil.nothingprojector.com/cdn/shop/files/x.png?v=1',
    storageUrl,
  ])('aceita %s', (url) => {
    expect(isAllowedProductImageUrl(url, patterns)).toBe(true);
  });

  it.each([
    ['domínio fora da lista', 'https://exemplo.com/foto.jpg'],
    ['caminho fora do permitido', 'https://brazil.nothingprojector.com/products/x.jpg'],
    ['outro bucket do Supabase', `${supabaseUrl}/storage/v1/object/public/avatars/a.png`],
    ['http sem TLS', 'http://images.unsplash.com/photo-123'],
    ['subdomínio parecido', 'https://images.unsplash.com.evil.com/photo.jpg'],
    ['texto que não é URL', 'imagem.png'],
  ])('recusa %s', (_case, url) => {
    expect(isAllowedProductImageUrl(url, patterns)).toBe(false);
  });

  it('não libera o Storage quando a URL do Supabase não está configurada', () => {
    expect(isAllowedProductImageUrl(storageUrl, getProductImagePatterns(''))).toBe(false);
  });
});

describe('createProductSchema.imageUrl', () => {
  const base = { name: 'Fone', externalLink: 'https://loja.exemplo/fone' };

  it('recusa imagem de domínio não permitido com mensagem orientando o upload', () => {
    const result = createProductSchema.safeParse({
      ...base,
      imageUrl: 'https://exemplo.com/a.jpg',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.imageUrl?.[0]).toMatch(/não permitido/);
  });

  it('trata imagem vazia como não informada', () => {
    expect(createProductSchema.parse({ ...base, imageUrl: '' }).imageUrl).toBeUndefined();
  });
});
