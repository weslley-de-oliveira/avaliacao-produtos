import { nanoid } from 'nanoid';
import type { AccountRole } from '@/lib/auth/session-account';
import { type SupabaseAdminClient, toIsoString, toRepositoryError } from './supabase-helpers';

export type Account = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AccountRole;
  active: boolean;
  createdAt: string;
};

/** Conta com o hash da senha: só deve circular dentro do fluxo de login. */
export type AccountWithPassword = Account & { passwordHash: string };

export type AccountName = Pick<Account, 'id' | 'firstName' | 'lastName'>;

export type NewAccount = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
};

export type AccountRepository = {
  findById(id: string): Promise<Account | null>;
  findByEmailWithPassword(email: string): Promise<AccountWithPassword | null>;
  findNamesByIds(ids: string[]): Promise<AccountName[]>;
  /** Lança `DuplicateRecordError` se o email já estiver cadastrado. */
  create(account: NewAccount): Promise<Account>;
};

const ACCOUNT_COLUMNS = 'id, first_name, last_name, email, role, active, created_at';

type AccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: AccountRole;
  active: boolean;
  created_at: string;
};

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    active: row.active,
    createdAt: toIsoString(row.created_at),
  };
}

export function createSupabaseAccountRepository(supabase: SupabaseAdminClient): AccountRepository {
  return {
    async findById(id) {
      const { data, error } = await supabase
        .from('accounts')
        .select(ACCOUNT_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError(error, 'buscar conta');
      }

      return data ? toAccount(data as AccountRow) : null;
    },

    async findByEmailWithPassword(email) {
      const { data, error } = await supabase
        .from('accounts')
        .select(`${ACCOUNT_COLUMNS}, password`)
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw toRepositoryError(error, 'buscar conta');
      }

      if (!data) {
        return null;
      }

      const row = data as AccountRow & { password: string };

      return { ...toAccount(row), passwordHash: row.password };
    },

    async findNamesByIds(ids) {
      if (ids.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('id, first_name, last_name')
        .in('id', ids);

      if (error) {
        throw toRepositoryError(error, 'buscar autores');
      }

      return ((data ?? []) as Pick<AccountRow, 'id' | 'first_name' | 'last_name'>[]).map((row) => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
      }));
    },

    async create(account) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          id: nanoid(),
          first_name: account.firstName,
          last_name: account.lastName,
          email: account.email,
          password: account.passwordHash,
          active: true,
          created_at: now,
          updated_at: now,
        })
        .select(ACCOUNT_COLUMNS)
        .single();

      if (error) {
        throw toRepositoryError(error, 'criar conta');
      }

      return toAccount(data as AccountRow);
    },
  };
}
