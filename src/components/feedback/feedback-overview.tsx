'use client';

import { AiReviewSummary } from './ai-review-summary';
import { RatingSummarySkeleton } from './feedback-skeleton';
import { RatingSummary } from './rating-summary';
import { useProductFeedbacks } from './use-product-feedbacks';

/**
 * Coluna de visão geral: nota geral com a distribuição e, logo abaixo, o
 * resumo das avaliações gerado por IA. Erros de carregamento são exibidos pela
 * lista de avaliações, então aqui o card só some.
 */
export function FeedbackOverview({ productId }: { productId: string }) {
  const query = useProductFeedbacks(productId);
  const summary = query.data?.pages[0]?.summary;

  return (
    <div className="space-y-6">
      {query.isPending ? <RatingSummarySkeleton /> : summary && <RatingSummary summary={summary} />}
      <AiReviewSummary productId={productId} />
    </div>
  );
}
