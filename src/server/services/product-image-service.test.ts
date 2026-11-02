import { describe, expect, it, vi } from 'vitest';
import { PRODUCT_IMAGE_MAX_BYTES } from '@/lib/images/product-images';
import type { ImageStorage } from '../storage/image-storage';
import {
  createProductImageService,
  detectImageType,
  EMPTY_IMAGE_MESSAGE,
  IMAGE_TOO_LARGE_MESSAGE,
  INVALID_IMAGE_TYPE_MESSAGE,
} from './product-image-service';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50,
]);
const HTML = new TextEncoder().encode('<html><script>alert(1)</script></html>');

function setup() {
  const storage: ImageStorage = {
    upload: vi.fn(async (path: string) => `https://cdn.exemplo/${path}`),
  };

  return { storage, service: createProductImageService({ storage }) };
}

describe('detectImageType', () => {
  it('reconhece JPG, PNG e WebP pelos primeiros bytes', () => {
    expect(detectImageType(JPEG)).toBe('image/jpeg');
    expect(detectImageType(PNG)).toBe('image/png');
    expect(detectImageType(WEBP)).toBe('image/webp');
  });

  it('não reconhece arquivos que não são imagem', () => {
    expect(detectImageType(HTML)).toBeNull();
    expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41]))).toBeNull();
  });
});

describe('ProductImageService.upload', () => {
  it('grava com nome gerado, extensão e tipo do conteúdo real e devolve a URL', async () => {
    const { service, storage } = setup();

    const { url } = await service.upload(PNG);

    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^products\/[A-Za-z0-9_-]+\.png$/),
      PNG,
      'image/png',
    );
    expect(url).toMatch(/^https:\/\/cdn\.exemplo\/products\/.+\.png$/);
  });

  it.each([
    ['arquivo vazio', new Uint8Array(), EMPTY_IMAGE_MESSAGE],
    ['conteúdo que não é imagem', HTML, INVALID_IMAGE_TYPE_MESSAGE],
    ['arquivo acima de 5 MB', new Uint8Array(PRODUCT_IMAGE_MAX_BYTES + 1), IMAGE_TOO_LARGE_MESSAGE],
  ])('recusa %s com BAD_REQUEST sem gravar nada', async (_case, bytes, message) => {
    const { service, storage } = setup();

    await expect(service.upload(bytes)).rejects.toMatchObject({ code: 'BAD_REQUEST', message });
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
