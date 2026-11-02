import { appRouter } from './root';
import { createTRPCContext } from './trpc';

/**
 * Caller tRPC para uso no servidor (rotas REST e Server Components): passa pelo
 * mesmo contexto, validação e middlewares das chamadas vindas do cliente.
 */
export async function createServerCaller() {
  return appRouter.createCaller(await createTRPCContext());
}
