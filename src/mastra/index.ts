import { Mastra } from '@mastra/core';
import { reviewSummaryAgent } from './agents/review-summary-agent';
import { supportAgent } from './agents/support-agent';

let mastraInstance: Mastra | undefined;

/**
 * Instância do Mastra criada sob demanda (lazy), com todos os agentes
 * registrados. A aplicação usa o `reviewSummaryAgent` diretamente pelo
 * `ReviewSummarizer` (src/server/ai); `getMastra()` serve a fluxos
 * internos/automatizados que precisem do registro completo.
 */
export function getMastra(): Mastra {
  if (!mastraInstance) {
    mastraInstance = new Mastra({
      agents: { supportAgent, reviewSummaryAgent },
    });
  }

  return mastraInstance;
}

export { reviewSummaryAgent, supportAgent };
