'use client';

import { api } from '@/trpc/client';

export const FEEDBACK_PAGE_SIZE = 10;

/**
 * Consulta paginada das avaliações do produto. A lista e o painel de nota
 * geral usam este mesmo hook: com a mesma chave, o React Query compartilha o
 * cache e faz uma única requisição para os dois.
 */
export function useProductFeedbacks(productId: string) {
  return api.feedbacks.listByProduct.useInfiniteQuery(
    { productId, limit: FEEDBACK_PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  );
}
