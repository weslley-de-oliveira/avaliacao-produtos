import { describe, expect, it } from 'vitest';
import { AppError } from '../errors';
import { createInMemoryProductRepository, makeProduct } from '../testing/in-memory-repositories';
import { createProductService } from './product-service';

function setup(count = 0) {
  const products = createInMemoryProductRepository(
    Array.from({ length: count }, (_, index) => makeProduct(index + 1)),
  );

  return { products, service: createProductService({ products }) };
}

describe('ProductService', () => {
  describe('list', () => {
    it('percorre todas as páginas pelo cursor, do mais novo ao mais antigo, sem repetir', async () => {
      const { service } = setup(5);

      const first = await service.list({ limit: 2 });
      const second = await service.list({ limit: 2, cursor: first.nextCursor ?? undefined });
      const third = await service.list({ limit: 2, cursor: second.nextCursor ?? undefined });

      expect([...first.items, ...second.items, ...third.items].map((p) => p.name)).toEqual([
        'Produto 5',
        'Produto 4',
        'Produto 3',
        'Produto 2',
        'Produto 1',
      ]);
      expect(third.nextCursor).toBeNull();
    });

    it('devolve lista vazia sem cursor quando não há produtos', async () => {
      const { service } = setup();

      expect(await service.list({})).toEqual({ items: [], nextCursor: null });
    });

    it('rejeita cursor inválido com BAD_REQUEST', async () => {
      const { service } = setup(1);

      await expect(service.list({ cursor: 'invalido' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Cursor inválido',
      });
    });
  });

  describe('create', () => {
    it('grava campos opcionais ausentes como null', async () => {
      const { service } = setup();

      const product = await service.create({
        name: 'Fone',
        externalLink: 'https://loja.exemplo/fone',
      });

      expect(product).toMatchObject({ name: 'Fone', description: null, imageUrl: null });
    });

    it('traduz link externo duplicado em CONFLICT', async () => {
      const { service } = setup(1);
      const [existing] = (await service.list({})).items;

      const attempt = service.create({ name: 'Cópia', externalLink: existing.externalLink });

      await expect(attempt).rejects.toBeInstanceOf(AppError);
      await expect(attempt).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'Já existe um produto com este link externo',
      });
    });
  });

  it('getById devolve null para produto inexistente', async () => {
    const { service } = setup(1);

    expect(await service.getById('nao-existe')).toBeNull();
  });
});
