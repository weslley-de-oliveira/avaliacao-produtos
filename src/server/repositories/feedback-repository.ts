import { nanoid } from 'nanoid';
import type { CursorPayload } from '@/lib/pagination/cursor';
import {
  keysetFilter,
  type SupabaseAdminClient,
  toIsoString,
  toRepositoryError,
} from './supabase-helpers';

export const FEEDBACK_SCORES = [1, 2, 3, 4, 5] as const;

export type FeedbackScore = (typeof FEEDBACK_SCORES)[number];

export type ScoreDistribution = Record<FeedbackScore, number>;

/** Avaliação como armazenada: o autor é só uma referência. */
export type FeedbackRecord = {
  id: string;
  productId: string;
  authorId: string;
  score: number;
  comment: string;
  createdAt: string;
};

export type NewFeedback = Omit<FeedbackRecord, 'id' | 'createdAt'>;

export type FeedbackRepository = {
  /** Avaliações do produto em ordem `created_at desc, id desc`, após o cursor. */
  listByProduct(
    productId: string,
    params: { limit: number; after?: CursorPayload },
  ): Promise<FeedbackRecord[]>;
  /** Quantidade de avaliações do produto para cada nota de 1 a 5. */
  countByScore(productId: string): Promise<ScoreDistribution>;
  create(feedback: NewFeedback): Promise<FeedbackRecord>;
};

type FeedbackRow = {
  id: string;
  product_id: string;
  created_by: string;
  score: number;
  comment: string;
  created_at: string;
};

const FEEDBACK_COLUMNS = 'id, product_id, created_by, score, comment, created_at';

function toRecord(row: FeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    productId: row.product_id,
    authorId: row.created_by,
    score: row.score,
    comment: row.comment,
    createdAt: toIsoString(row.created_at),
  };
}

export function createSupabaseFeedbackRepository(
  supabase: SupabaseAdminClient,
): FeedbackRepository {
  return {
    async listByProduct(productId, { limit, after }) {
      let query = supabase
        .from('products_feedbacks')
        .select(FEEDBACK_COLUMNS)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);

      if (after) {
        query = query.or(keysetFilter(after));
      }

      const { data, error } = await query;

      if (error) {
        throw toRepositoryError(error, 'listar avaliações');
      }

      return ((data ?? []) as FeedbackRow[]).map(toRecord);
    },

    /**
     * Uma contagem por nota (`head: true`, sem trazer linhas) em vez de baixar
     * todas as avaliações. As cinco consultas são indexadas e rodam em paralelo.
     */
    async countByScore(productId) {
      const results = await Promise.all(
        FEEDBACK_SCORES.map((score) =>
          supabase
            .from('products_feedbacks')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', productId)
            .eq('score', score),
        ),
      );

      const distribution: ScoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      results.forEach((result, index) => {
        if (result.error) {
          throw toRepositoryError(result.error, 'contar avaliações');
        }

        distribution[FEEDBACK_SCORES[index]] = result.count ?? 0;
      });

      return distribution;
    },

    async create(feedback) {
      const { data, error } = await supabase
        .from('products_feedbacks')
        .insert({
          id: nanoid(),
          product_id: feedback.productId,
          created_by: feedback.authorId,
          score: feedback.score,
          comment: feedback.comment,
          created_at: new Date().toISOString(),
        })
        .select(FEEDBACK_COLUMNS)
        .single();

      if (error) {
        throw toRepositoryError(error, 'salvar avaliação');
      }

      return toRecord(data as FeedbackRow);
    },
  };
}
