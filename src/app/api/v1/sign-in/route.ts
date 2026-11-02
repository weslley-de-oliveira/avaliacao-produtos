import { NextResponse } from 'next/server';
import type { SignInInput } from '@/lib/validations/sign-in';
import { createServerCaller } from '@/server/api/caller';
import { NO_STORE_HEADERS, readJsonBody, toErrorResponse } from '@/server/http/responses';

/**
 * Adaptador REST do fluxo de sign-in (contrato exigido pela spec).
 *
 * Toda a regra de negócio vive no serviço de autenticação; aqui só traduzimos
 * o transporte HTTP e os erros para os status 200/400/401/500.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);

  if (body === undefined) {
    return NextResponse.json(
      {
        error: 'Dados inválidos',
        details: {
          formErrors: ['Corpo da requisição deve ser um JSON válido'],
          fieldErrors: {},
        },
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const caller = await createServerCaller();
    const { account } = await caller.auth.signIn(body as SignInInput);

    return NextResponse.json({ data: account }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    return toErrorResponse(error, {
      fallbackMessage: 'Não foi possível entrar',
      headers: NO_STORE_HEADERS,
    });
  }
}
