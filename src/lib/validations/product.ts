import { z } from 'zod';
import { isAllowedProductImageUrl } from '@/lib/images/product-images';

const HTTP_URL_MESSAGE = 'URL deve usar http ou https';

const httpUrlSchema = z
  .string()
  .trim()
  .url('URL inválida')
  .refine((value) => /^https?:\/\//i.test(value), HTTP_URL_MESSAGE);

/**
 * Imagem só de domínios liberados no `next.config.ts`: qualquer outra URL
 * quebraria a renderização do `next/image` na home e na página do produto.
 */
const productImageUrlSchema = httpUrlSchema.refine(
  (value) => isAllowedProductImageUrl(value),
  'Domínio de imagem não permitido. Envie o arquivo pelo formulário.',
);

/**
 * Aceita `null` ou string vazia como "não informado" para simplificar o
 * consumo pelo formulário/JSON manual, sem gravar strings vazias no banco.
 */
const optionalImageUrlSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value,
  productImageUrlSchema.optional(),
);

const optionalDescriptionSchema = z.preprocess(
  (value) =>
    value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value,
  z.string().trim().optional(),
);

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  externalLink: z.string(),
  score: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export const productByIdSchema = z.object({
  id: z.string().trim().min(1, 'Id do produto é obrigatório').max(64, 'Id do produto inválido'),
});

export type ProductByIdInput = z.infer<typeof productByIdSchema>;

export const productListInputSchema = z.object({
  cursor: z.string().min(1, 'Cursor inválido').optional(),
  limit: z.number().int().min(1).max(24).optional(),
});

export type ProductListInput = z.infer<typeof productListInputSchema>;

/**
 * Variante usada pelos adaptadores REST: query strings chegam como texto e
 * precisam de coerção antes de validar.
 */
export const productListQuerySchema = z.object({
  cursor: z.string().min(1, 'Cursor inválido').optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const productListOutputSchema = z.object({
  items: z.array(productSchema),
  nextCursor: z.string().nullable(),
});

export type ProductListOutput = z.infer<typeof productListOutputSchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  description: optionalDescriptionSchema,
  imageUrl: optionalImageUrlSchema,
  externalLink: httpUrlSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Campos de texto do formulário de criação. A imagem é um arquivo enviado à
 * parte (`POST /api/v1/product-images`), e a URL resultante entra no
 * `createProductSchema`.
 */
export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do produto'),
  externalLink: httpUrlSchema,
  description: z.string(),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
