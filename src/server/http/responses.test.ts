import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toErrorResponse } from './responses';

const fallbackMessage = 'Falhou';

async function respond(error: unknown, options = {}) {
  const response = toErrorResponse(error, { fallbackMessage, ...options });

  return { status: response.status, body: await response.json(), headers: response.headers };
}

describe('toErrorResponse', () => {
  it('converte erro de validação em 400 com detalhes por campo', async () => {
    const zodError = z.object({ name: z.string() }).safeParse({}).error;
    const { status, body } = await respond(
      new TRPCError({ code: 'BAD_REQUEST', message: 'input', cause: zodError }),
    );

    expect(status).toBe(400);
    expect(body.error).toBe('Dados inválidos');
    expect(body.details.fieldErrors).toHaveProperty('name');
  });

  it.each([
    ['UNAUTHORIZED', 401],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['BAD_REQUEST', 400],
  ] as const)('usa o status HTTP do código %s', async (code, expected) => {
    const { status, body } = await respond(new TRPCError({ code, message: 'mensagem' }));

    expect(status).toBe(expected);
    expect(body).toEqual({ error: 'mensagem' });
  });

  it('não expõe a mensagem de erros internos nem de erros desconhecidos', async () => {
    const internal = await respond(
      new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'detalhe do banco' }),
    );
    const unknown = await respond(new Error('stack trace'));

    expect(internal).toMatchObject({ status: 500, body: { error: fallbackMessage } });
    expect(unknown).toMatchObject({ status: 500, body: { error: fallbackMessage } });
  });

  it('aplica override por código e mantém os headers informados', async () => {
    const { status, body, headers } = await respond(
      new TRPCError({ code: 'BAD_REQUEST', message: 'id inválido' }),
      {
        overrides: { BAD_REQUEST: { status: 404, message: 'Produto não encontrado' } },
        headers: { 'Cache-Control': 'no-store' },
      },
    );

    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Produto não encontrado' });
    expect(headers.get('Cache-Control')).toBe('no-store');
  });
});
