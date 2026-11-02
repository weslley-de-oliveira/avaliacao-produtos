/**
 * Modelo do resumo de avaliações, no formato `provedor/modelo` do Mastra.
 * O padrão é o Gemini 3.1 Flash-Lite: plano gratuito, resposta rápida e sem
 * "raciocínio" (o 3.8 Flash ficou sobrecarregado no plano gratuito nos
 * testes). Pode ser trocado por `AI_SUMMARY_MODEL` (ex.:
 * `groq/llama-3.3-70b-versatile`, `openai/gpt-4o-mini`) desde que a chave do
 * provedor esteja configurada.
 * Fica fora do arquivo do agente para não carregar o Mastra só para ler esta
 * configuração.
 */
export const REVIEW_SUMMARY_MODEL = process.env.AI_SUMMARY_MODEL || 'google/gemini-3.1-flash-lite';
