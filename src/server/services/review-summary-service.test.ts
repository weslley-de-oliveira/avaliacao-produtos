import { describe, expect, it, vi } from 'vitest';
import type { ReviewSummarizer } from '../ai/review-summarizer';
import {
  createInMemoryFeedbackRepository,
  createInMemoryProductRepository,
  createInMemoryReviewSummaryRepository,
  makeProduct,
} from '../testing/in-memory-repositories';
import {
  createReviewSummaryService,
  GENERATION_FAILURE_COOLDOWN_MS,
  MAX_REVIEWS_IN_SUMMARY,
} from './review-summary-service';

const product = makeProduct(1, { name: 'Fone Aurora' });

function setup({ summarizer }: { summarizer?: ReviewSummarizer | null } = {}) {
  const feedbacks = createInMemoryFeedbackRepository();
  const summaries = createInMemoryReviewSummaryRepository();
  const fakeSummarizer: ReviewSummarizer = {
    model: 'teste/modelo',
    summarize: vi.fn(async ({ reviews }) => `Resumo de ${reviews.length} avaliações.`),
  };
  const onGenerationError = vi.fn();
  const clock = { now: Date.UTC(2026, 0, 1) };
  const service = createReviewSummaryService({
    products: createInMemoryProductRepository([product]),
    feedbacks,
    summaries,
    summarizer: summarizer === undefined ? fakeSummarizer : summarizer,
    onGenerationError,
    failures: new Map(),
    now: () => clock.now,
  });

  const addReview = (score: number, comment = `Nota ${score}`) =>
    feedbacks.create({ productId: product.id, authorId: 'acc-1', score, comment });

  return { service, summaries, fakeSummarizer, onGenerationError, addReview, clock };
}

describe('ReviewSummaryService', () => {
  it('não gera resumo para produto sem avaliações', async () => {
    const { service, fakeSummarizer } = setup();

    expect(await service.getByProduct(product.id)).toEqual({ status: 'insufficient' });
    expect(fakeSummarizer.summarize).not.toHaveBeenCalled();
  });

  it('gera com todas as avaliações, salva e informa quantas foram consideradas', async () => {
    const { service, summaries, fakeSummarizer, addReview } = setup();
    await addReview(5, 'Ótimo som');
    await addReview(2, 'Bateria fraca');

    const result = await service.getByProduct(product.id);

    expect(fakeSummarizer.summarize).toHaveBeenCalledWith({
      productName: 'Fone Aurora',
      reviews: expect.arrayContaining([
        { score: 5, comment: 'Ótimo som' },
        { score: 2, comment: 'Bateria fraca' },
      ]),
    });
    expect(result).toMatchObject({ status: 'ready', summary: 'Resumo de 2 avaliações.' });
    expect(result).toMatchObject({ feedbackCount: 2 });
    expect(summaries.rows[0]).toMatchObject({ feedbackCount: 2, model: 'teste/modelo' });
  });

  it('reaproveita o resumo salvo enquanto o total de avaliações não muda', async () => {
    const { service, fakeSummarizer, addReview } = setup();
    await addReview(4);

    await service.getByProduct(product.id);
    await service.getByProduct(product.id);

    expect(fakeSummarizer.summarize).toHaveBeenCalledOnce();
  });

  it('gera de novo quando chega uma avaliação nova', async () => {
    const { service, fakeSummarizer, addReview } = setup();
    await addReview(4);
    await service.getByProduct(product.id);
    await addReview(1);

    const result = await service.getByProduct(product.id);

    expect(fakeSummarizer.summarize).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ summary: 'Resumo de 2 avaliações.', feedbackCount: 2 });
  });

  it('envia no máximo o teto de avaliações ao modelo', async () => {
    const { service, fakeSummarizer, addReview } = setup();
    for (let index = 0; index < MAX_REVIEWS_IN_SUMMARY + 5; index += 1) {
      await addReview(3);
    }

    await service.getByProduct(product.id);

    const [{ reviews }] = vi.mocked(fakeSummarizer.summarize).mock.calls[0];
    expect(reviews).toHaveLength(MAX_REVIEWS_IN_SUMMARY);
  });

  it('fica indisponível sem IA configurada e sem resumo salvo', async () => {
    const { service, addReview } = setup({ summarizer: null });
    await addReview(5);

    expect(await service.getByProduct(product.id)).toEqual({ status: 'unavailable' });
  });

  it('mantém o último resumo quando o modelo falha, sem quebrar a página', async () => {
    const { service, fakeSummarizer, onGenerationError, addReview } = setup();
    await addReview(5);
    await service.getByProduct(product.id);
    await addReview(1);
    vi.mocked(fakeSummarizer.summarize).mockRejectedValueOnce(new Error('timeout'));

    const result = await service.getByProduct(product.id);

    expect(result).toMatchObject({ status: 'ready', summary: 'Resumo de 1 avaliações.' });
    expect(onGenerationError).toHaveBeenCalledOnce();
  });

  it('fica indisponível quando o modelo falha na primeira geração', async () => {
    const { service, fakeSummarizer, addReview } = setup();
    await addReview(5);
    vi.mocked(fakeSummarizer.summarize).mockRejectedValueOnce(new Error('sem crédito'));

    expect(await service.getByProduct(product.id)).toEqual({ status: 'unavailable' });
  });

  it('responde NOT_FOUND para produto inexistente', async () => {
    const { service } = setup();

    await expect(service.getByProduct('nao-existe')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('após uma falha, não chama o modelo de novo durante a pausa', async () => {
    const { service, fakeSummarizer, addReview, clock } = setup();
    await addReview(5);
    vi.mocked(fakeSummarizer.summarize).mockRejectedValueOnce(new Error('sem crédito'));

    await service.getByProduct(product.id);
    clock.now += GENERATION_FAILURE_COOLDOWN_MS - 1;
    const duringCooldown = await service.getByProduct(product.id);

    expect(duringCooldown).toEqual({ status: 'unavailable' });
    expect(fakeSummarizer.summarize).toHaveBeenCalledOnce();
  });

  it('tenta de novo depois que a pausa termina', async () => {
    const { service, fakeSummarizer, addReview, clock } = setup();
    await addReview(5);
    vi.mocked(fakeSummarizer.summarize).mockRejectedValueOnce(new Error('sem crédito'));

    await service.getByProduct(product.id);
    clock.now += GENERATION_FAILURE_COOLDOWN_MS;
    const afterCooldown = await service.getByProduct(product.id);

    expect(afterCooldown).toMatchObject({ status: 'ready' });
    expect(fakeSummarizer.summarize).toHaveBeenCalledTimes(2);
  });
});
