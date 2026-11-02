import type { CursorPayload } from '@/lib/pagination/cursor';
import type { Product } from '@/lib/validations/product';
import { DuplicateRecordError } from '../errors';
import type { Account, AccountRepository } from '../repositories/account-repository';
import type {
  FeedbackRecord,
  FeedbackRepository,
  ScoreDistribution,
} from '../repositories/feedback-repository';
import type { ProductRepository } from '../repositories/product-repository';

/**
 * Implementações em memória das interfaces de repositório, usadas nos testes
 * dos serviços. Reproduzem a ordenação `created_at desc, id desc` e o keyset.
 */

type Keyed = { createdAt: string; id: string };

function byNewest(a: Keyed, b: Keyed): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

function isAfter(row: Keyed, cursor: CursorPayload): boolean {
  return (
    row.createdAt < cursor.createdAt || (row.createdAt === cursor.createdAt && row.id < cursor.id)
  );
}

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

function timestamp(offsetSeconds: number): string {
  return new Date(Date.UTC(2026, 0, 1) + offsetSeconds * 1000).toISOString();
}

export function createInMemoryProductRepository(initial: Product[] = []): ProductRepository & {
  rows: Product[];
} {
  const rows = [...initial];

  return {
    rows,
    async list({ limit, after }) {
      return rows
        .filter((row) => !after || isAfter(row, after))
        .sort(byNewest)
        .slice(0, limit);
    },
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async exists(id) {
      return rows.some((row) => row.id === id);
    },
    async create(data) {
      if (rows.some((row) => row.externalLink === data.externalLink)) {
        throw new DuplicateRecordError('products_external_link_key');
      }

      const now = timestamp(rows.length);
      const product: Product = {
        id: nextId('prod'),
        ...data,
        score: false,
        createdAt: now,
        updatedAt: now,
      };

      rows.push(product);
      return product;
    },
  };
}

export function makeProduct(index: number, overrides: Partial<Product> = {}): Product {
  const createdAt = timestamp(index);

  return {
    id: `prod-${String(index).padStart(4, '0')}`,
    name: `Produto ${index}`,
    description: null,
    imageUrl: null,
    externalLink: `https://loja.exemplo/produtos/${index}`,
    score: false,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export type StoredAccount = Account & { passwordHash: string };

export function createInMemoryAccountRepository(
  initial: StoredAccount[] = [],
): AccountRepository & {
  rows: StoredAccount[];
} {
  const rows = [...initial];
  const toAccount = ({ passwordHash: _hash, ...account }: StoredAccount): Account => account;

  return {
    rows,
    async findById(id) {
      const account = rows.find((row) => row.id === id);
      return account ? toAccount(account) : null;
    },
    async findByEmailWithPassword(email) {
      return rows.find((row) => row.email === email) ?? null;
    },
    async findNamesByIds(ids) {
      return rows
        .filter((row) => ids.includes(row.id))
        .map(({ id, firstName, lastName }) => ({ id, firstName, lastName }));
    },
    async create(data) {
      if (rows.some((row) => row.email === data.email)) {
        throw new DuplicateRecordError('accounts_email_key');
      }

      const account: StoredAccount = {
        id: nextId('acc'),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: 'user',
        active: true,
        createdAt: timestamp(rows.length),
      };

      rows.push(account);
      return toAccount(account);
    },
  };
}

export function createInMemoryFeedbackRepository(
  initial: FeedbackRecord[] = [],
): FeedbackRepository & {
  rows: FeedbackRecord[];
} {
  const rows = [...initial];

  return {
    rows,
    async listByProduct(productId, { limit, after }) {
      return rows
        .filter((row) => row.productId === productId && (!after || isAfter(row, after)))
        .sort(byNewest)
        .slice(0, limit);
    },
    async countByScore(productId) {
      const distribution: ScoreDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      for (const row of rows) {
        if (row.productId === productId) {
          distribution[row.score as keyof ScoreDistribution] += 1;
        }
      }

      return distribution;
    },
    async create(data) {
      const record: FeedbackRecord = {
        id: nextId('fb'),
        ...data,
        createdAt: timestamp(rows.length),
      };

      rows.push(record);
      return record;
    },
  };
}
