import { createSession, destroySession } from '@/lib/auth/session';
import { signInSchema } from '@/lib/validations/sign-in';
import { signUpSchema } from '@/lib/validations/sign-up';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(({ ctx, input }) => ctx.services.auth.signUp(input)),

  signIn: publicProcedure.input(signInSchema).mutation(async ({ ctx, input }) => {
    const account = await ctx.services.auth.signIn(input);

    // A sessão é responsabilidade da borda HTTP (cookie), não do serviço.
    await createSession(account.id);

    return { account };
  }),

  signOut: publicProcedure.mutation(async () => {
    await destroySession();

    return { success: true };
  }),

  me: publicProcedure.query(({ ctx }) => ctx.account),
});
