import { TRPCError } from '@trpc/server';
import { describe, expect, it, vi } from 'vitest';
import type { SessionAccount } from '@/lib/auth/session-account';
import type { Services } from '../container';
import { AppError, RepositoryError } from '../errors';
import { appRouter } from './root';
import type { Context } from './trpc';

function callerWith(
  services: Partial<Record<keyof Services, unknown>>,
  account: SessionAccount | null = null,
) {
  return appRouter.createCaller({ account, services: services as Services } satisfies Context);
}

describe('borda de erros do tRPC', () => {
  it('converte AppError no TRPCError de mesmo código e mensagem', async () => {
    const caller = callerWith({
      products: { getById: vi.fn().mockRejectedValue(new AppError('NOT_FOUND', 'Sumiu')) },
    });

    await expect(caller.products.byId({ id: 'abc' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sumiu',
    });
  });

  it('esconde detalhes de erros inesperados atrás de uma mensagem genérica', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const caller = callerWith({
      products: {
        getById: vi
          .fn()
          .mockRejectedValue(new RepositoryError('buscar produto', { cause: 'senha do banco' })),
      },
    });

    const error = await caller.products.byId({ id: 'abc' }).catch((e: unknown) => e);

    // Sem a borda, o tRPC repassaria a mensagem do erro original ("Falha ao buscar produto").
    expect(error).toBeInstanceOf(TRPCError);
    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno. Tente novamente em instantes.',
    });
  });

  it('exige sessão nas rotas protegidas antes de chamar o serviço', async () => {
    const create = vi.fn();
    const caller = callerWith({ products: { create } });

    await expect(
      caller.products.create({ name: 'X', externalLink: 'https://loja.exemplo/x' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(create).not.toHaveBeenCalled();
  });

  it('valida o input antes de chamar o serviço', async () => {
    const list = vi.fn();
    const caller = callerWith({ products: { list } });

    await expect(caller.products.list({ limit: 999 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(list).not.toHaveBeenCalled();
  });
});

describe('adminProcedure (criação de produtos)', () => {
  const baseAccount: SessionAccount = {
    id: 'acc-1',
    firstName: 'Maria',
    lastName: 'Silva',
    email: 'maria@exemplo.com',
    role: 'user',
  };
  const input = { name: 'Fone', externalLink: 'https://loja.exemplo/fone' };

  it('responde FORBIDDEN para conta sem papel de administrador', async () => {
    const create = vi.fn();
    const caller = callerWith({ products: { create } }, baseAccount);

    await expect(caller.products.create(input)).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Apenas administradores podem cadastrar produtos',
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('delega ao serviço quando a conta é administradora', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'prod-1' });
    const caller = callerWith({ products: { create } }, { ...baseAccount, role: 'admin' });

    await expect(caller.products.create(input)).resolves.toEqual({ id: 'prod-1' });
    expect(create).toHaveBeenCalledWith(input);
  });
});
