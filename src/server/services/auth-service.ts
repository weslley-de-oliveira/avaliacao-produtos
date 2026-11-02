import type { SessionAccount } from '@/lib/auth/session-account';
import type { SignInInput } from '@/lib/validations/sign-in';
import type { SignUpInput } from '@/lib/validations/sign-up';
import { AppError, DuplicateRecordError } from '../errors';
import type { Account, AccountRepository } from '../repositories/account-repository';
import type { PasswordHasher } from '../security/password-hasher';

export const INVALID_CREDENTIALS_MESSAGE = 'Email ou senha inválidos';
export const DUPLICATE_EMAIL_MESSAGE = 'Este email já está cadastrado';

/**
 * Hash bcrypt válido usado quando o email não existe.
 *
 * Comparar contra ele mantém o tempo de resposta próximo ao de um email
 * existente, reduzindo a diferença observável entre os dois casos.
 */
const DUMMY_PASSWORD_HASH = '$2a$10$NeZibGZ61zTvPQrdhjqfPuI9qFWgatQn458Z/gk/GTeHo0WI.xR8e';

function toSessionAccount(account: Account): SessionAccount {
  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    role: account.role,
  };
}

type AuthServiceDeps = {
  accounts: AccountRepository;
  hasher: PasswordHasher;
};

export function createAuthService({ accounts, hasher }: AuthServiceDeps) {
  return {
    /**
     * Valida as credenciais. Email inexistente, senha errada e conta inativa
     * compartilham a mesma resposta para não revelar quais emails existem.
     */
    async signIn(input: SignInInput): Promise<SessionAccount> {
      const account = await accounts.findByEmailWithPassword(input.email);
      const passwordMatches = await hasher.compare(
        input.password,
        account?.passwordHash ?? DUMMY_PASSWORD_HASH,
      );

      if (!account || !passwordMatches || !account.active) {
        throw new AppError('UNAUTHORIZED', INVALID_CREDENTIALS_MESSAGE);
      }

      return toSessionAccount(account);
    },

    async signUp(input: SignUpInput): Promise<Account> {
      try {
        return await accounts.create({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email.toLowerCase(),
          passwordHash: await hasher.hash(input.password),
        });
      } catch (error) {
        if (error instanceof DuplicateRecordError) {
          throw new AppError('CONFLICT', DUPLICATE_EMAIL_MESSAGE);
        }

        throw error;
      }
    },

    /** Conta ativa da sessão, ou `null` se não existir ou estiver inativa. */
    async getActiveAccount(id: string): Promise<SessionAccount | null> {
      const account = await accounts.findById(id);

      return account?.active ? toSessionAccount(account) : null;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
