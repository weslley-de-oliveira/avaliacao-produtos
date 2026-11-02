/** Avaliação enviada ao modelo: só nota e comentário, sem dados de quem escreveu. */
export type ReviewForSummary = {
  score: number;
  comment: string;
};

export type ReviewSummarizerInput = {
  productName: string;
  reviews: ReviewForSummary[];
};

/**
 * Porta da IA usada pelo serviço de resumo. A implementação concreta (agente
 * do Mastra) fica atrás desta interface, então o serviço não depende do
 * provedor de modelo e é testado com um resumidor falso.
 */
export type ReviewSummarizer = {
  /** Identificador do modelo, gravado junto do resumo. */
  model: string;
  summarize(input: ReviewSummarizerInput): Promise<string>;
};

const MAX_SUMMARY_LENGTH = 1200;

/**
 * JSON com `<` e `>` escapados como `\u003c` e `\u003e` (continua sendo JSON
 * válido): um comentário não consegue escrever `</avaliacoes>` e "fechar" o
 * bloco de dados antes da hora.
 */
function toDataLine(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * Monta a mensagem para o modelo. Os comentários entram como JSON dentro de um
 * bloco delimitado: são dados de usuários, não instruções.
 */
export function buildReviewSummaryPrompt({ productName, reviews }: ReviewSummarizerInput): string {
  const lines = reviews.map((review) =>
    toDataLine({ nota: review.score, comentario: review.comment }),
  );

  return [
    `Produto: ${toDataLine(productName)}`,
    `Total de avaliações: ${reviews.length}`,
    '',
    'Avaliações (uma por linha, em JSON):',
    '<avaliacoes>',
    ...lines,
    '</avaliacoes>',
  ].join('\n');
}

/** Normaliza a resposta: texto corrido, sem marcação Markdown e com tamanho limitado. */
export function sanitizeSummary(text: string): string {
  const plain = text
    .replace(/[*_#`>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= MAX_SUMMARY_LENGTH) {
    return plain;
  }

  const cut = plain.slice(0, MAX_SUMMARY_LENGTH);
  const lastSentenceEnd = cut.lastIndexOf('. ');

  return lastSentenceEnd > 0 ? cut.slice(0, lastSentenceEnd + 1) : `${cut.trimEnd()}…`;
}
