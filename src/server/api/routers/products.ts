import {
  createProductSchema,
  productByIdSchema,
  productListInputSchema,
} from '@/lib/validations/product';
import { adminProcedure, createTRPCRouter, publicProcedure } from '../trpc';

export const productsRouter = createTRPCRouter({
  list: publicProcedure
    .input(productListInputSchema)
    .query(({ ctx, input }) => ctx.services.products.list(input)),

  byId: publicProcedure
    .input(productByIdSchema)
    .query(({ ctx, input }) => ctx.services.products.getById(input.id)),

  create: adminProcedure
    .input(createProductSchema)
    .mutation(({ ctx, input }) => ctx.services.products.create(input)),
});
