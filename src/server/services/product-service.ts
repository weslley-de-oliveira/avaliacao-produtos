import { decodeKeysetCursor, paginate } from '@/lib/pagination/cursor';
import type {
  CreateProductInput,
  Product,
  ProductListInput,
  ProductListOutput,
} from '@/lib/validations/product';
import { AppError, DuplicateRecordError } from '../errors';
import type { ProductRepository } from '../repositories/product-repository';

export const DEFAULT_PRODUCT_PAGE_SIZE = 12;

export function createProductService({ products }: { products: ProductRepository }) {
  return {
    async list({
      cursor,
      limit = DEFAULT_PRODUCT_PAGE_SIZE,
    }: ProductListInput): Promise<ProductListOutput> {
      const after = cursor ? decodeKeysetCursor(cursor) : undefined;

      if (after === null) {
        throw new AppError('BAD_REQUEST', 'Cursor inválido');
      }

      const rows = await products.list({ limit: limit + 1, after });

      return paginate(rows, limit, (product) => ({
        createdAt: product.createdAt,
        id: product.id,
      }));
    },

    getById(id: string): Promise<Product | null> {
      return products.findById(id);
    },

    async create(input: CreateProductInput): Promise<Product> {
      try {
        return await products.create({
          name: input.name,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          externalLink: input.externalLink,
        });
      } catch (error) {
        if (error instanceof DuplicateRecordError) {
          throw new AppError('CONFLICT', 'Já existe um produto com este link externo');
        }

        throw error;
      }
    },
  };
}

export type ProductService = ReturnType<typeof createProductService>;
