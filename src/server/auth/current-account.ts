import { cache } from 'react';
import { getSessionAccountId } from '@/lib/auth/session';
import type { SessionAccount } from '@/lib/auth/session-account';
import { createServices } from '../container';

/**
 * Resolve a conta autenticada a partir do cookie de sessão.
 *
 * A sessão guarda apenas o id da conta; os dados públicos são lidos do banco
 * para refletirem qualquer alteração de perfil e para validar `active`.
 * `cache` evita repetir a consulta dentro do mesmo request.
 */
export const getCurrentAccount = cache(async (): Promise<SessionAccount | null> => {
  const accountId = await getSessionAccountId();

  if (!accountId) {
    return null;
  }

  try {
    return await createServices().auth.getActiveAccount(accountId);
  } catch {
    // Falha ao consultar a conta equivale a não estar autenticado.
    return null;
  }
});
