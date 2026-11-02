import type { ReviewSummary } from '@/lib/validations/feedback';
import type { ReviewSummarizer } from '../ai/review-summarizer';
import { AppError } from '../errors';
import { FEEDBACK_SCORES, type FeedbackRepository } from '../repositories/feedback-repository';
import type { ProductRepository } from '../repositories/product-repository';
import type {
  ReviewSummaryRepository,
  StoredReviewSummary,
} from '../repositories/review-summary-repository';

/** Avaliações necessárias para gerar o primeiro resumo. */
export const MIN_REVIEWS_FOR_SUMMARY = 1;

/** Teto de avaliações enviadas ao modelo (as mais recentes), para limitar custo e contexto. */
export const MAX_REVIEWS_IN_SUMMARY = 200;

/**
 * Pausa após uma falha do modelo: durante esse tempo o produto não dispara
 * nova geração, e a página responde na hora em vez de esperar o provedor
 * recusar de novo (ex.: conta sem crédito leva segundos para responder).
 */
export const GENERATION_FAILURE_COOLDOWN_MS = 5 * 60_000;

/** Último instante de falha por produto, compartilhado entre requisições da instância. */
const recentFailures = new Map<string, number>();

type ReviewSummaryServiceDeps = {
  products: ProductRepository;
  feedbacks: FeedbackRepository;
  summaries: ReviewSummaryRepository;
  /** `null` quando a IA não está configurada (sem chave do provedor). */
  summarizer: ReviewSummarizer | null;
  onGenerationError?: (error: unknown) => void;
  /** Injetáveis nos testes. */
  failures?: Map<string, number>;
  now?: () => number;
};

function ready(stored: StoredReviewSummary): ReviewSummary {
  return {
    status: 'ready',
    summary: stored.summary,
    feedbackCount: stored.feedbackCount,
    generatedAt: stored.generatedAt,
  };
}

export function createReviewSummaryService({
  products,
  feedbacks,
  summaries,
  summarizer,
  onGenerationError = (error) => console.error('[review-summary] falha ao gerar resumo', error),
  failures = recentFailures,
  now = Date.now,
}: ReviewSummaryServiceDeps) {
  return {
    /**
     * Resumo das avaliações do produto. O resumo salvo é reaproveitado enquanto
     * o total de avaliações não mudar; quando muda, um novo é gerado. Se a IA
     * falhar ou não estiver configurada, devolve o último resumo salvo (se
     * houver) em vez de quebrar a página.
     */
    async getByProduct(productId: string): Promise<ReviewSummary> {
      const product = await products.findById(productId);

      if (!product) {
        throw new AppError('NOT_FOUND', 'Produto não encontrado');
      }

      const distribution = await feedbacks.countByScore(productId);
      const total = FEEDBACK_SCORES.reduce((sum, score) => sum + distribution[score], 0);

      if (total < MIN_REVIEWS_FOR_SUMMARY) {
        return { status: 'insufficient' };
      }

      const stored = await summaries.find(productId);

      if (stored && stored.feedbackCount === total) {
        return ready(stored);
      }

      const fallback: ReviewSummary = stored ? ready(stored) : { status: 'unavailable' };
      const lastFailure = failures.get(productId);

      if (!summarizer || (lastFailure && now() - lastFailure < GENERATION_FAILURE_COOLDOWN_MS)) {
        return fallback;
      }

      try {
        const reviews = await feedbacks.listByProduct(productId, { limit: MAX_REVIEWS_IN_SUMMARY });
        const summary = await summarizer.summarize({
          productName: product.name,
          reviews: reviews.map(({ score, comment }) => ({ score, comment })),
        });

        const saved = await summaries.save({
          productId,
          summary,
          feedbackCount: total,
          model: summarizer.model,
        });

        failures.delete(productId);
        return ready(saved);
      } catch (error) {
        failures.set(productId, now());
        onGenerationError(error);
        return fallback;
      }
    },
  };
}

export type ReviewSummaryService = ReturnType<typeof createReviewSummaryService>;
