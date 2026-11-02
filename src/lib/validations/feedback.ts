import { z } from 'zod';

export const FEEDBACK_COMMENT_MAX_LENGTH = 1000;

export const feedbackSchema = z.object({
  id: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(FEEDBACK_COMMENT_MAX_LENGTH),
  createdAt: z.string(),
  author: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});

export type Feedback = z.infer<typeof feedbackSchema>;

export const feedbackSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number().int(),
  distribution: z.object({
    1: z.number().int(),
    2: z.number().int(),
    3: z.number().int(),
    4: z.number().int(),
    5: z.number().int(),
  }),
});

export type FeedbackSummary = z.infer<typeof feedbackSummarySchema>;

export const feedbackListInputSchema = z.object({
  productId: z.string().min(1, 'Id do produto é obrigatório'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(30).optional(),
});

export type FeedbackListInput = z.infer<typeof feedbackListInputSchema>;

export const feedbackListOutputSchema = z.object({
  items: z.array(feedbackSchema),
  nextCursor: z.string().nullable(),
  summary: feedbackSummarySchema,
});

export type FeedbackListOutput = z.infer<typeof feedbackListOutputSchema>;

export const createFeedbackSchema = z.object({
  productId: z.string().min(1, 'Id do produto é obrigatório'),
  score: z
    .number()
    .int('Nota deve ser um número inteiro')
    .min(1, 'Nota deve ser entre 1 e 5')
    .max(5, 'Nota deve ser entre 1 e 5'),
  comment: z
    .string()
    .trim()
    .min(1, 'Comentário é obrigatório')
    .max(FEEDBACK_COMMENT_MAX_LENGTH, 'Comentário deve ter no máximo 1000 caracteres'),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

/**
 * Schema do formulário (a nota e o comentário). O `productId` nunca vem do
 * formulário: é resolvido pela rota/página no servidor.
 */
export const feedbackFormSchema = z.object({
  score: z
    .number({
      required_error: 'Escolha uma nota de 1 a 5',
      invalid_type_error: 'Escolha uma nota de 1 a 5',
    })
    .int('Escolha uma nota de 1 a 5')
    .min(1, 'Escolha uma nota de 1 a 5')
    .max(5, 'Escolha uma nota de 1 a 5'),
  comment: z
    .string()
    .trim()
    .min(1, 'Escreva um comentário sobre o produto')
    .max(FEEDBACK_COMMENT_MAX_LENGTH, 'Comentário deve ter no máximo 1000 caracteres'),
});

export type FeedbackFormInput = z.infer<typeof feedbackFormSchema>;

export const reviewSummaryInputSchema = z.object({
  productId: z.string().min(1, 'Id do produto é obrigatório'),
});

/**
 * Resumo das avaliações gerado por IA:
 * - `ready`: resumo disponível (`feedbackCount` = avaliações consideradas);
 * - `insufficient`: o produto ainda não tem avaliações suficientes;
 * - `unavailable`: IA não configurada ou falhou, e não há resumo salvo.
 */
export type ReviewSummary =
  | { status: 'ready'; summary: string; feedbackCount: number; generatedAt: string }
  | { status: 'insufficient' }
  | { status: 'unavailable' };
