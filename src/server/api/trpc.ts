import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { SessionAccount } from '@/lib/auth/session-account';
import { AUTHENTICATION_REQUIRED_MESSAGE, assertAdmin } from '../auth/authorization';
import { getCurrentAccount } from '../auth/current-account';
import { createServices, type Services } from '../container';
import { AppError } from '../errors';

export type Context = {
  account: SessionAccount | null;
  services: Services;
};

export async function createTRPCContext(): Promise<Context> {
  return {
    account: await getCurrentAccount(),
    services: createServices(),
  };
}

const INTERNAL_ERROR_MESSAGE = 'Erro interno. Tente novamente em instantes.';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Borda de erros: `AppError` vira o `TRPCError` de mesmo código; qualquer outro
 * erro inesperado vira um 500 genérico, sem expor detalhes do banco ao cliente.
 */
const errorBoundary = t.middleware(async ({ next, path }) => {
  const result = await next();

  if (result.ok) {
    return result;
  }

  const { cause } = result.error;

  if (cause instanceof AppError) {
    throw new TRPCError({ code: cause.code, message: cause.message, cause });
  }

  if (result.error.code === 'INTERNAL_SERVER_ERROR') {
    console.error(`[trpc] ${path}`, cause ?? result.error);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: INTERNAL_ERROR_MESSAGE, cause });
  }

  return result;
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(errorBoundary);
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  const account = ctx.account;

  if (!account) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: AUTHENTICATION_REQUIRED_MESSAGE,
    });
  }

  return next({
    ctx: {
      ...ctx,
      account,
    },
  });
});

/** Exige conta com papel `admin` (403 para as demais). */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) =>
  next({ ctx: { ...ctx, account: assertAdmin(ctx.account) } }),
);
