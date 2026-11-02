import { NextResponse } from 'next/server';
import { createFeedbackSchema } from '@/lib/validations/feedback';
import { createServerCaller } from '@/server/api/caller';
import { invalidJsonResponse, readJsonBody, toErrorResponse } from '@/server/http/responses';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseLimit(rawLimit: string | null): number | null {
  if (rawLimit === null || rawLimit === '') {
    return DEFAULT_LIMIT;
  }

  const limit = Number(rawLimit);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  return limit;
}

/**
 * Adaptador REST de leitura das avaliações (público).
 *
 * Delega para `feedbacks.listByProduct` para compartilhar paginação, resumo e
 * regra de 404 com o restante da aplicação.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get('limit'));

  if (limit === null) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: { limit: 'Deve ser um número inteiro entre 1 e 30' },
      },
      { status: 400 },
    );
  }

  const cursor = url.searchParams.get('cursor') ?? undefined;

  try {
    const caller = await createServerCaller();
    const result = await caller.feedbacks.listByProduct({ productId: id, cursor, limit });

    return NextResponse.json({
      data: result.items,
      nextCursor: result.nextCursor,
      summary: result.summary,
    });
  } catch (error) {
    return toErrorResponse(error, { fallbackMessage: 'Erro interno ao carregar as avaliações' });
  }
}

/**
 * Adaptador REST de criação de avaliação (protegido por sessão).
 *
 * O `productId` vem da rota e o `created_by` da sessão; nenhum dos dois é
 * aceito do corpo da requisição.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await readJsonBody(request);

  if (body === undefined) {
    return invalidJsonResponse();
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Corpo da requisição deve ser um objeto JSON' },
      { status: 400 },
    );
  }

  const parsed = createFeedbackSchema.safeParse({ ...body, productId: id });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const caller = await createServerCaller();
    const feedback = await caller.feedbacks.create(parsed.data);

    return NextResponse.json({ data: feedback }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, { fallbackMessage: 'Não foi possível salvar a avaliação' });
  }
}
