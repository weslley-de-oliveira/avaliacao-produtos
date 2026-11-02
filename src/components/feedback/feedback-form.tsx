'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  type FeedbackFormInput,
  feedbackFormSchema,
} from '@/lib/validations/feedback';
import { api } from '@/trpc/client';
import { StarRatingInput } from './star-rating';

type FeedbackFormProps = {
  productId: string;
};

const GENERIC_ERROR = 'Não foi possível salvar a avaliação. Tente novamente.';

export function FeedbackForm({ productId }: FeedbackFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const utils = api.useUtils();

  const form = useForm<FeedbackFormInput>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      score: 0,
      comment: '',
    },
  });

  const createFeedback = api.feedbacks.create.useMutation({
    onSuccess: async () => {
      setError(null);
      setSuccessMessage('Avaliação publicada.');
      form.reset({ score: 0, comment: '' });
      await utils.feedbacks.listByProduct.invalidate({ productId });
    },
    onError: (mutationError) => {
      setSuccessMessage(null);
      const code = mutationError.data?.code;

      if (code === 'UNAUTHORIZED') {
        setError('Sua sessão expirou. Entre novamente para publicar sua avaliação.');
        return;
      }

      if (code === 'BAD_REQUEST') {
        // Erros de input do tRPC trazem a mensagem crua do Zod (JSON); usamos
        // o primeiro erro de campo já formatado pelo errorFormatter.
        const fieldErrors: Record<string, string[] | undefined> =
          mutationError.data?.zodError?.fieldErrors ?? {};
        const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);
        setError(firstFieldError ?? 'Dados inválidos. Revise a nota e o comentário.');
        return;
      }

      if (code === 'NOT_FOUND') {
        setError('Produto não encontrado.');
        return;
      }

      setError(GENERIC_ERROR);
    },
  });

  const onSubmit = (data: FeedbackFormInput) => {
    setError(null);
    setSuccessMessage(null);
    createFeedback.mutate({
      productId,
      score: data.score,
      comment: data.comment,
    });
  };

  return (
    <section
      aria-labelledby="feedback-form-title"
      className="relative border border-ink/15 bg-paper"
    >
      <div aria-hidden="true" className="h-1.5 bg-accent" />

      <div className="p-6 sm:p-8">
        <header className="mb-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            <span aria-hidden="true" className="flex items-end gap-[3px]">
              <span className="w-[3px] bg-accent" style={{ height: 8 }} />
              <span className="w-[3px] bg-accent" style={{ height: 12 }} />
              <span className="w-[3px] bg-accent" style={{ height: 16 }} />
            </span>
            Sua avaliação
          </p>
          <h2
            id="feedback-form-title"
            className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Como você avalia este produto?
          </h2>
          <p className="mt-1 text-sm text-ink/60">Conte o que funcionou e o que não funcionou.</p>
        </header>

        {successMessage && (
          <Alert
            className="mb-6 rounded-none border-0 bg-ink px-4 py-3 text-paper"
            aria-live="polite"
          >
            <AlertTitle>Avaliação enviada</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            className="mb-6 rounded-none border-0 bg-destructive px-4 py-3 text-destructive-foreground"
            aria-live="assertive"
          >
            <AlertTitle>Não foi possível publicar</AlertTitle>
            <AlertDescription>
              {error}
              {createFeedback.error?.data?.code === 'UNAUTHORIZED' && (
                <span className="mt-2 block">
                  <Link
                    href={`/auth/sign-in?redirect=${encodeURIComponent(`/products/${productId}`)}`}
                    className="font-semibold underline underline-offset-4"
                  >
                    Entrar novamente
                  </Link>
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-ink">Nota</FormLabel>
                  <FormControl>
                    <StarRatingInput
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      disabled={createFeedback.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-ink">Comentário</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={5}
                      maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
                      onChange={(event) => {
                        field.onChange(event);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      placeholder="Conte o que funcionou e o que não funcionou."
                      className="w-full border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                    />
                  </FormControl>
                  <p aria-hidden="true" className="text-right text-xs tabular-nums text-ink/50">
                    {field.value?.length ?? 0}/{FEEDBACK_COMMENT_MAX_LENGTH}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="rounded-none bg-ink text-base font-semibold text-paper hover:bg-brand hover:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              disabled={createFeedback.isPending}
            >
              {createFeedback.isPending ? 'Publicando...' : 'Publicar avaliação'}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
