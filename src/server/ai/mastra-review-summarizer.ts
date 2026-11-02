import {
  buildReviewSummaryPrompt,
  type ReviewSummarizer,
  sanitizeSummary,
} from './review-summarizer';

const GENERATION_TIMEOUT_MS = 20_000;

/**
 * Variáveis de ambiente aceitas como chave de cada provedor suportado pelo
 * resumo (os nomes que o Mastra lê). Basta uma delas estar definida.
 */
const PROVIDER_API_KEYS: Record<string, string[]> = {
  google: ['GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY'],
  groq: ['GROQ_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
};

/** `true` quando a chave do provedor do modelo está configurada. */
export function isSummarizerConfigured(
  model: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const keyNames = PROVIDER_API_KEYS[model.split('/')[0] ?? ''] ?? [];

  return keyNames.some((name) => Boolean(env[name]));
}

/**
 * Implementação do `ReviewSummarizer` com o agente do Mastra. O agente é
 * carregado sob demanda, para não pesar nas rotas que não geram resumo.
 */
export function createMastraReviewSummarizer(model: string): ReviewSummarizer {
  return {
    model,
    async summarize(input) {
      const { reviewSummaryAgent } = await import('@/mastra/agents/review-summary-agent');
      const result = await reviewSummaryAgent.generate(buildReviewSummaryPrompt(input), {
        // O limite cobre só a resposta: o resumo pedido tem 2 a 4 frases.
        modelSettings: { temperature: 0.3, maxOutputTokens: 1024 },
        // Em modelos Gemini com "raciocínio", ele consome o mesmo limite de saída
        // e pode deixar o resumo vazio; resumir não precisa dele. Outros
        // provedores ignoram esta opção.
        providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      const summary = sanitizeSummary(result.text);

      if (!summary) {
        throw new Error('O modelo devolveu um resumo vazio');
      }

      return summary;
    },
  };
}
