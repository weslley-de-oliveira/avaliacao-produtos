import { isAdmin, type SessionAccount } from '@/lib/auth/session-account';
import { AppError } from '../errors';

export const AUTHENTICATION_REQUIRED_MESSAGE = 'Autenticação necessária';
export const ADMIN_ONLY_MESSAGE = 'Apenas administradores podem cadastrar produtos';

/**
 * Regra única de autorização administrativa, usada pelo tRPC
 * (`adminProcedure`) e pelas rotas REST que não passam por ele (upload).
 */
export function assertAdmin(account: SessionAccount | null): SessionAccount {
  if (!account) {
    throw new AppError('UNAUTHORIZED', AUTHENTICATION_REQUIRED_MESSAGE);
  }

  if (!isAdmin(account)) {
    throw new AppError('FORBIDDEN', ADMIN_ONLY_MESSAGE);
  }

  return account;
}
