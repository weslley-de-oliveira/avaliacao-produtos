'use client';

import { Sparkles } from 'lucide-react';
import { api } from '@/trpc/client';

function reviewCountLabel(count: number): string {
  return count === 1 ? '1 avaliação' : `${count} avaliações`;
}

function Frame({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <section
      aria-labelledby="ai-review-summary-title"
      aria-busy={busy}
      className="relative border border-ink bg-ink text-paper"
    >
      <div aria-hidden="true" className="h-1.5 bg-accent" />

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="ai-review-summary-title"
            className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/70"
          >
            Resumo das avaliações
          </h2>
          <span className="inline-flex items-center gap-1 bg-accent px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-paper">
            <Sparkles aria-hidden="true" className="h-3 w-3" />
            IA
          </span>
        </div>

        {children}
      </div>
    </section>
  );
}

/**
 * Resumo geral das avaliações escrito pelo agente de IA (Mastra). Fica abaixo
 * do gráfico de notas, destacado e identificado como conteúdo gerado por IA.
 */
export function AiReviewSummary({ productId }: { productId: string }) {
  const query = api.feedbacks.summary.useQuery(
    { productId },
    { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  );

  // Sem avaliações ainda, não há o que resumir.
  if (query.data?.status === 'insufficient') {
    return null;
  }

  if (query.isPending) {
    return (
      <Frame busy>
        <p className="sr-only">Gerando resumo das avaliações com IA.</p>
        <div aria-hidden="true" className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse bg-paper/15 motion-reduce:animate-none" />
          <div className="h-3 w-11/12 animate-pulse bg-paper/15 motion-reduce:animate-none" />
          <div className="h-3 w-2/3 animate-pulse bg-paper/15 motion-reduce:animate-none" />
        </div>
        <p aria-hidden="true" className="mt-4 text-xs text-paper/55">
          Gerando resumo com IA...
        </p>
      </Frame>
    );
  }

  if (query.isError || query.data.status === 'unavailable') {
    return (
      <Frame>
        <p className="mt-4 text-sm text-paper/70">O resumo por IA está indisponível no momento.</p>
      </Frame>
    );
  }

  const { summary, feedbackCount } = query.data;

  return (
    <Frame>
      <p className="mt-4 text-sm leading-relaxed text-paper/90">{summary}</p>
      <p className="mt-4 border-t border-paper/15 pt-3 text-xs leading-snug text-paper/55">
        Gerado por IA a partir de {reviewCountLabel(feedbackCount)}. Pode conter imprecisões.
      </p>
    </Frame>
  );
}
