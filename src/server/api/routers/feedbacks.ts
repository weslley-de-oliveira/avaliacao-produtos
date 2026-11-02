import { createFeedbackSchema, feedbackListInputSchema } from '@/lib/validations/feedback';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const feedbacksRouter = createTRPCRouter({
  listByProduct: publicProcedure
    .input(feedbackListInputSchema)
    .query(({ ctx, input }) => ctx.services.feedbacks.listByProduct(input)),

  create: protectedProcedure
    .input(createFeedbackSchema)
    .mutation(({ ctx, input }) => ctx.services.feedbacks.create(input, ctx.account)),
});
