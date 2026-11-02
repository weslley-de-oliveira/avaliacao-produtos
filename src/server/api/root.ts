import { authRouter } from './routers/auth';
import { feedbacksRouter } from './routers/feedbacks';
import { productsRouter } from './routers/products';
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  feedbacks: feedbacksRouter,
});

export type AppRouter = typeof appRouter;
