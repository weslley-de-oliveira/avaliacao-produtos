import { nanoid } from 'nanoid';
import type { CursorPayload } from '@/lib/pagination/cursor';
import type { Product } from '@/lib/validations/product';
import {
  keysetFilter,
  type SupabaseAdminClient,
  toIsoString,
  toRepositoryError,
} from './supabase-helpers';

export type NewProduct = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  externalLink: string;
};

export type ProductRepository = {
  /** Produtos em ordem `created_at desc, id desc`, após o cursor (se houver). */
  list(params: { limit: number; after?: CursorPayload }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  exists(id: string): Promise<boolean>;
  /** Lança `DuplicateRecordError` se o `externalLink` já estiver cadastrado. */
  create(data: NewProduct): Promise<Product>;
};

const PRODUCT_COLUMNS =
  'id, name, description, image_url, external_link, score, created_at, updated_at';

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  external_link: string;
  score: boolean;
  created_at: string;
  updated_at: string;
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    externalLink: row.external_link,
    score: row.score,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export function createSupabaseProductRepository(supabase: SupabaseAdminClient): ProductRepository {
  return {
    async list({ limit, after }) {
      let query = supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

      if (after) {
        query = query.or(keysetFilter(after));
      }

      const { data, error } = await query;

      if (error) {
        throw toRepositoryError(error, 'listar produtos');
      }

      return ((data ?? []) as ProductRow[]).map(toProduct);
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError(error, 'buscar produto');
      }

      return data ? toProduct(data as ProductRow) : null;
    },

    async exists(id) {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw toRepositoryError(error, 'verificar produto');
      }

      return data !== null;
    },

    async create(product) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('products')
        .insert({
          id: nanoid(),
          name: product.name,
          description: product.description,
          image_url: product.imageUrl,
          external_link: product.externalLink,
          score: false,
          created_at: now,
          updated_at: now,
        })
        .select(PRODUCT_COLUMNS)
        .single();

      if (error) {
        throw toRepositoryError(error, 'criar produto');
      }

      return toProduct(data as ProductRow);
    },
  };
}
