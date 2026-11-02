import { TRPCError } from '@trpc/server';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

const INVALID_DATA_MESSAGE = 'Dados inválidos';

type ErrorResponseOptions = {
  /** Mensagem de qualquer erro 5xx ou inesperado; detalhes internos nunca vão ao cliente. */
  fallbackMessage: string;
  headers?: HeadersInit;
  /** Troca status/mensagem de um código específico (ex.: id inválido vira 404). */
  overrides?: Partial<Record<TRPC_ERROR_CODE_KEY, { status: number; message: string }>>;
};

/**
 * Traduz para a resposta REST o erro de um procedimento tRPC ou de um serviço
 * chamado diretamente (`AppError`, que usa os mesmos códigos).
 *
 * - Validação (Zod) → `400 { error: 'Dados inválidos', details }`
 * - Erros 4xx (401, 403, 404, 409...) → status do próprio código + mensagem
 * - Demais → `500 { error: fallbackMessage }`
 */
export function toErrorResponse(rawError: unknown, options: ErrorResponseOptions): NextResponse {
  const { fallbackMessage, headers, overrides } = options;
  const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers });
  const error =
    rawError instanceof AppError
      ? new TRPCError({ code: rawError.code, message: rawError.message, cause: rawError })
      : rawError;

  if (error instanceof TRPCError) {
    const override = overrides?.[error.code];

    if (override) {
      return json({ error: override.message }, override.status);
    }

    if (error.code === 'BAD_REQUEST' && error.cause instanceof ZodError) {
      return json({ error: INVALID_DATA_MESSAGE, details: error.cause.flatten() }, 400);
    }

    const status = getHTTPStatusCodeFromError(error);

    if (status < 500) {
      return json({ error: error.message }, status);
    }
  }

  return json({ error: fallbackMessage }, 500);
}

/** Resposta padrão para corpo ausente ou que não é JSON. */
export function invalidJsonResponse(headers?: HeadersInit): NextResponse {
  return NextResponse.json(
    { error: 'Corpo da requisição deve ser um JSON válido' },
    { status: 400, headers },
  );
}

/** Lê o corpo como JSON; `undefined` indica corpo inválido. */
export async function readJsonBody(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
