export type AccountRole = 'user' | 'admin';

/** Dados públicos da conta autenticada, compartilhados entre servidor e UI. */
export type SessionAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AccountRole;
};

export function isAdmin(account: Pick<SessionAccount, 'role'> | null | undefined): boolean {
  return account?.role === 'admin';
}
