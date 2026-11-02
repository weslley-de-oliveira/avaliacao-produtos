import { describe, expect, it, vi } from 'vitest';
import type { PasswordHasher } from '../security/password-hasher';
import {
  createInMemoryAccountRepository,
  type StoredAccount,
} from '../testing/in-memory-repositories';
import {
  createAuthService,
  DUPLICATE_EMAIL_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
} from './auth-service';

/** Hasher reversível e instantâneo: os testes cobrem a regra, não o bcrypt. */
const fakeHasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  compare: async (password, hash) => hash === `hashed:${password}`,
};

const maria: StoredAccount = {
  id: 'acc-maria',
  firstName: 'Maria',
  lastName: 'Silva',
  email: 'maria@exemplo.com',
  passwordHash: 'hashed:senha-certa',
  role: 'user',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function setup(accounts: StoredAccount[] = [maria]) {
  const hasher = { hash: vi.fn(fakeHasher.hash), compare: vi.fn(fakeHasher.compare) };
  const repository = createInMemoryAccountRepository(accounts);

  return { hasher, repository, service: createAuthService({ accounts: repository, hasher }) };
}

describe('AuthService.signIn', () => {
  it('devolve só os dados públicos da conta com credenciais corretas', async () => {
    const { service } = setup();

    expect(await service.signIn({ email: maria.email, password: 'senha-certa' })).toEqual({
      id: maria.id,
      firstName: 'Maria',
      lastName: 'Silva',
      email: maria.email,
      role: 'user',
    });
  });

  it.each([
    ['senha errada', [maria], { email: maria.email, password: 'errada' }],
    ['email inexistente', [maria], { email: 'ninguem@exemplo.com', password: 'senha-certa' }],
    [
      'conta inativa',
      [{ ...maria, active: false }],
      { email: maria.email, password: 'senha-certa' },
    ],
  ])('responde UNAUTHORIZED genérico para %s', async (_case, accounts, input) => {
    const { service } = setup(accounts);

    await expect(service.signIn(input)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      message: INVALID_CREDENTIALS_MESSAGE,
    });
  });

  it('compara a senha mesmo quando o email não existe, para não revelar contas por tempo', async () => {
    const { service, hasher } = setup();

    await expect(service.signIn({ email: 'ninguem@exemplo.com', password: 'x' })).rejects.toThrow();
    expect(hasher.compare).toHaveBeenCalledOnce();
  });
});

describe('AuthService.signUp', () => {
  it('normaliza o email e grava apenas o hash da senha', async () => {
    const { service, repository } = setup([]);

    const account = await service.signUp({
      firstName: 'João',
      lastName: 'Souza',
      email: 'Joao@Exemplo.COM',
      password: 'segredo1',
      confirmPassword: 'segredo1',
    });

    expect(account.email).toBe('joao@exemplo.com');
    expect(repository.rows[0].passwordHash).toBe('hashed:segredo1');
    expect(account).not.toHaveProperty('passwordHash');
  });

  it('traduz email duplicado em CONFLICT', async () => {
    const { service } = setup();

    await expect(
      service.signUp({
        firstName: 'Outra',
        lastName: 'Maria',
        email: maria.email,
        password: 'segredo1',
        confirmPassword: 'segredo1',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT', message: DUPLICATE_EMAIL_MESSAGE });
  });
});

describe('AuthService.getActiveAccount', () => {
  it('ignora contas inativas', async () => {
    const { service } = setup([{ ...maria, active: false }]);

    expect(await service.getActiveAccount(maria.id)).toBeNull();
  });
});
