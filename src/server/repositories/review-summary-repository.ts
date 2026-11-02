import { type SupabaseAdminClient, toIsoString, toRepositoryError } from './supabase-helpers';

/** Resumo de avaliações já gerado, com o total de avaliações que ele cobre. */
export type StoredReviewSummary = {
  productId: string;
  summary: string;
  feedbackCount: number;
  model: string;
  generatedAt: string;
};

export type ReviewSummaryRepository = {
  find(productId: string): Promise<StoredReviewSummary | null>;
  /** Grava ou substitui o resumo do produto. */
  save(summary: Omit<StoredReviewSummary, 'generatedAt'>): Promise<StoredReviewSummary>;
};

const SUMMARY_COLUMNS = 'product_id, summary, feedback_count, model, generated_at';

type SummaryRow = {
  product_id: string;
  summary: string;
  feedback_count: number;
  model: string;
  generated_at: string;
};

function toSummary(row: SummaryRow): StoredReviewSummary {
  return {
    productId: row.product_id,
    summary: row.summary,
    feedbackCount: row.feedback_count,
    model: row.model,
    generatedAt: toIsoString(row.generated_at),
  };
}

export function createSupabaseReviewSummaryRepository(
  supabase: SupabaseAdminClient,
): ReviewSummaryRepository {
  return {
    async find(productId) {
      const { data, error } = await supabase
        .from('product_review_summaries')
        .select(SUMMARY_COLUMNS)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        throw toRepositoryError(error, 'buscar resumo das avaliações');
      }

      return data ? toSummary(data as SummaryRow) : null;
    },

    async save(summary) {
      const { data, error } = await supabase
        .from('product_review_summaries')
        .upsert({
          product_id: summary.productId,
          summary: summary.summary,
          feedback_count: summary.feedbackCount,
          model: summary.model,
          generated_at: new Date().toISOString(),
        })
        .select(SUMMARY_COLUMNS)
        .single();

      if (error) {
        throw toRepositoryError(error, 'salvar resumo das avaliações');
      }

      return toSummary(data as SummaryRow);
    },
  };
}
