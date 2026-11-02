import { NextResponse } from 'next/server';
import type { SignUpInput } from '@/lib/validations/sign-up';
import { createServerCaller } from '@/server/api/caller';
import { invalidJsonResponse, readJsonBody, toErrorResponse } from '@/server/http/responses';

/**
 * Adaptador REST do fluxo de sign-up (contrato exigido pelo spec: POST /api/v1/sign-up).
 *
 * Não reimplementa regra de negócio: delega para o mesmo procedimento tRPC usado
 * pelo formulário, garantindo validação, hash e persistência únicos.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);

  if (body === undefined) {
    return invalidJsonResponse();
  }

  try {
    const caller = await createServerCaller();
    const account = await caller.auth.signUp(body as SignUpInput);

    // Mantém o formato (snake_case) já publicado por este endpoint.
    return NextResponse.json(
      {
        success: true,
        data: {
          id: account.id,
          first_name: account.firstName,
          last_name: account.lastName,
          email: account.email,
          active: account.active,
          created_at: account.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error, { fallbackMessage: 'Erro interno ao criar a conta' });
  }
}
