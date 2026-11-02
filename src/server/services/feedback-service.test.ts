import { describe, expect, it } from 'vitest';
import {
  createInMemoryAccountRepository,
  createInMemoryFeedbackRepository,
  createInMemoryProductRepository,
  makeProduct,
} from '../testing/in-memory-repositories';
import { createFeedbackService, summarize } from './feedback-service';

const author = { id: 'acc-maria', firstName: 'Maria', lastName: 'Silva' };

function setup() {
  const product = makeProduct(1);
  const products = createInMemoryProductRepository([product]);
  const feedbacks = createInMemoryFeedbackRepository();
  const accounts = createInMemoryAccountRepository([
    {
      ...author,
      email: 'maria@exemplo.com',
      passwordHash: 'hash',
      role: 'user',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  return {
    product,
    feedbacks,
    service: createFeedbackService({ feedbacks, products, accounts }),
  };
}

describe('summarize', () => {
  it('calcula total e média com uma casa decimal', () => {
    expect(summarize({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 })).toEqual({
      average: 4,
      count: 3,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 },
    });
    expect(summarize({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 }).average).toBe(4.3);
  });

  it('não tem média quando não há avaliações', () => {
    expect(summarize({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })).toMatchObject({ average: null, count: 0 });
  });
});

describe('FeedbackService', () => {
  it('cria a avaliação com o autor da sessão e a inclui na listagem e no resumo', async () => {
    const { service, product } = setup();

    const created = await service.create(
      { productId: product.id, score: 5, comment: 'Excelente' },
      author,
    );
    const list = await service.listByProduct({ productId: product.id });

    expect(created.author).toEqual(author);
    expect(list.items).toEqual([created]);
    expect(list.summary).toMatchObject({ average: 5, count: 1 });
  });

  it('usa nome genérico quando o autor não existe mais', async () => {
    const { service, product, feedbacks } = setup();
    await feedbacks.create({
      productId: product.id,
      authorId: 'conta-removida',
      score: 3,
      comment: 'Ok',
    });

    const [feedback] = (await service.listByProduct({ productId: product.id })).items;

    expect(feedback.author).toEqual({ id: 'conta-removida', firstName: 'Pessoa', lastName: '' });
  });

  it('pagina as avaliações pelo cursor', async () => {
    const { service, product } = setup();
    for (const score of [1, 2, 3]) {
      await service.create({ productId: product.id, score, comment: `Nota ${score}` }, author);
    }

    const first = await service.listByProduct({ productId: product.id, limit: 2 });
    const second = await service.listByProduct({
      productId: product.id,
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });

    expect(first.items.map((f) => f.score)).toEqual([3, 2]);
    expect(second.items.map((f) => f.score)).toEqual([1]);
    expect(second.nextCursor).toBeNull();
    expect(second.summary.count).toBe(3);
  });

  it('responde NOT_FOUND para produto inexistente ao listar e ao criar', async () => {
    const { service } = setup();

    await expect(service.listByProduct({ productId: 'nao-existe' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(
      service.create({ productId: 'nao-existe', score: 4, comment: 'Bom' }, author),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
