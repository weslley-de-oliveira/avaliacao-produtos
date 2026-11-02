import { NextResponse } from 'next/server';
import { PRODUCT_IMAGE_MAX_BYTES } from '@/lib/images/product-images';
import { assertAdmin } from '@/server/auth/authorization';
import { getCurrentAccount } from '@/server/auth/current-account';
import { createServices } from '@/server/container';
import { AppError } from '@/server/errors';
import { NO_STORE_HEADERS, toErrorResponse } from '@/server/http/responses';
import { IMAGE_TOO_LARGE_MESSAGE } from '@/server/services/product-image-service';

/** Folga para os delimitadores do multipart além do próprio arquivo. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * Upload da imagem de um produto (multipart, campo `file`). Restrito a
 * administradores. Responde `201 { data: { url } }` com a URL pública, que o
 * formulário envia em seguida como `imageUrl` na criação do produto.
 */
export async function POST(request: Request) {
  try {
    assertAdmin(await getCurrentAccount());

    // Recusa cedo uploads grandes, antes de ler o corpo inteiro na memória.
    const declaredLength = Number(request.headers.get('content-length') ?? 0);

    if (declaredLength > PRODUCT_IMAGE_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return NextResponse.json(
        { error: IMAGE_TOO_LARGE_MESSAGE },
        { status: 413, headers: NO_STORE_HEADERS },
      );
    }

    const file = await request
      .formData()
      .then((form) => form.get('file'))
      .catch(() => null);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Envie a imagem no campo "file" (multipart/form-data)' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { url } = await createServices().productImages.upload(bytes);

    return NextResponse.json({ data: { url } }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    if (!(error instanceof AppError)) {
      console.error('[product-images] upload falhou', error);
    }

    return toErrorResponse(error, {
      fallbackMessage: 'Não foi possível enviar a imagem',
      headers: NO_STORE_HEADERS,
    });
  }
}
