import { NextResponse } from 'next/server';
import { createServerCaller } from '@/server/api/caller';
import { toErrorResponse } from '@/server/http/responses';

const PUBLIC_CACHE = 'public, s-maxage=60, stale-while-revalidate=120';
const NOT_FOUND_MESSAGE = 'Produto não encontrado';

/**
 * Contrato consumido pela página de detalhes (feature Feedback).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = id?.trim();

  if (!productId) {
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  try {
    const caller = await createServerCaller();
    const product = await caller.products.byId({ id: productId });

    if (!product) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(
      { data: product },
      { status: 200, headers: { 'Cache-Control': PUBLIC_CACHE } },
    );
  } catch (error) {
    // Id em formato inválido não pode existir: responde como "não encontrado".
    return toErrorResponse(error, {
      fallbackMessage: 'Não foi possível carregar o produto',
      overrides: { BAD_REQUEST: { status: 404, message: NOT_FOUND_MESSAGE } },
    });
  }
}
