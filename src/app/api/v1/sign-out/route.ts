import { NextResponse } from 'next/server';
import { createServerCaller } from '@/server/api/caller';
import { NO_STORE_HEADERS } from '@/server/http/responses';

/**
 * Adaptador REST do logout. Delega ao mesmo procedimento tRPC e é idempotente:
 * sem sessão ativa também responde 204.
 */
export async function POST() {
  try {
    const caller = await createServerCaller();
    await caller.auth.signOut();
  } catch {
    // O cookie de sessão é limpo de forma best-effort; o logout não deve
    // falhar para o cliente por causa de um erro interno.
  }

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
