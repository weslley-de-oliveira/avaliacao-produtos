import { nanoid } from 'nanoid';
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TYPES,
  type ProductImageType,
} from '@/lib/images/product-images';
import { AppError } from '../errors';
import type { ImageStorage } from '../storage/image-storage';

export const INVALID_IMAGE_TYPE_MESSAGE = 'Envie uma imagem JPG, PNG ou WebP';
export const IMAGE_TOO_LARGE_MESSAGE = 'A imagem deve ter no máximo 5 MB';
export const EMPTY_IMAGE_MESSAGE = 'Selecione uma imagem';

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * Identifica o formato pelos primeiros bytes do arquivo ("magic bytes"). O
 * `Content-Type` enviado pelo navegador é controlado pelo cliente e não é
 * usado para decidir o que é aceito.
 */
export function detectImageType(bytes: Uint8Array): ProductImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  // RIFF....WEBP
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }

  return null;
}

export function createProductImageService({ storage }: { storage: ImageStorage }) {
  return {
    async upload(bytes: Uint8Array): Promise<{ url: string }> {
      if (bytes.byteLength === 0) {
        throw new AppError('BAD_REQUEST', EMPTY_IMAGE_MESSAGE);
      }

      if (bytes.byteLength > PRODUCT_IMAGE_MAX_BYTES) {
        throw new AppError('BAD_REQUEST', IMAGE_TOO_LARGE_MESSAGE);
      }

      const type = detectImageType(bytes);

      if (!type) {
        throw new AppError('BAD_REQUEST', INVALID_IMAGE_TYPE_MESSAGE);
      }

      // Nome gerado no servidor: o nome original do arquivo nunca vira caminho.
      const path = `products/${nanoid()}.${PRODUCT_IMAGE_TYPES[type]}`;

      return { url: await storage.upload(path, bytes, type) };
    },
  };
}

export type ProductImageService = ReturnType<typeof createProductImageService>;
