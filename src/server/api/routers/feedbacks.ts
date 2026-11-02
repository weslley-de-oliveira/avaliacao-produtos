import {
  createFeedbackSchema,
  feedbackListInputSchema,
  reviewSummaryInputSchema,
} from '@/lib/validations/feedback';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const feedbacksRouter = createTRPCRouter({
  listByProduct: publicProcedure
    .input(feedbackListInputSchema)
    .query(({ ctx, input }) => ctx.services.feedbacks.listByProduct(input)),

  /** Resumo das avaliações gerado por IA (com cache por total de avaliações). */
  summary: publicProcedure
    .input(reviewSummaryInputSchema)
    .query(({ ctx, input }) => ctx.services.reviewSummaries.getByProduct(input.productId)),

  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(({ ctx, input }) => ctx.services.feedbacks.create(input, ctx.account)),
});
