import { NextResponse } from 'next/server';
import type { CreateProductInput } from '@/lib/validations/product';
import { productListQuerySchema } from '@/lib/validations/product';
import { createServerCaller } from '@/server/api/caller';
import {
  invalidJsonResponse,
  NO_STORE_HEADERS,
  readJsonBody,
  toErrorResponse,
} from '@/server/http/responses';

const PUBLIC_CACHE = 'public, s-maxage=30, stale-while-revalidate=60';

/**
 * Adaptador REST da listagem. Delega ao router tRPC para manter uma única
 * regra de paginação/validação. A spec pede um array na resposta; o cursor da
 * próxima página vai no header `X-Next-Cursor`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = productListQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const caller = await createServerCaller();
    const { items, nextCursor } = await caller.products.list(parsed.data);
    const headers = new Headers({ 'Cache-Control': PUBLIC_CACHE });

    if (nextCursor) {
      headers.set('X-Next-Cursor', nextCursor);
    }

    return NextResponse.json(items, { status: 200, headers });
  } catch (error) {
    return toErrorResponse(error, { fallbackMessage: 'Não foi possível carregar os produtos' });
  }
}

/**
 * Inserção manual de produto. Protegida por sessão: o catálogo de demonstração
 * vem do seed, então este endpoint é uma operação administrativa.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);

  if (body === undefined) {
    return invalidJsonResponse(NO_STORE_HEADERS);
  }

  try {
    const caller = await createServerCaller();
    const product = await caller.products.create(body as CreateProductInput);

    return NextResponse.json({ data: product }, { status: 201, headers: NO_STORE_HEADERS });
  } catch (error) {
    return toErrorResponse(error, {
      fallbackMessage: 'Não foi possível criar o produto',
      headers: NO_STORE_HEADERS,
    });
  }
}
