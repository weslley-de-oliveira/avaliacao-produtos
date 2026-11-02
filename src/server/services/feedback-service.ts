import { decodeKeysetCursor, paginate } from '@/lib/pagination/cursor';
import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackListInput,
  FeedbackListOutput,
  FeedbackSummary,
} from '@/lib/validations/feedback';
import { AppError } from '../errors';
import type { AccountName, AccountRepository } from '../repositories/account-repository';
import {
  FEEDBACK_SCORES,
  type FeedbackRecord,
  type FeedbackRepository,
  type ScoreDistribution,
} from '../repositories/feedback-repository';
import type { ProductRepository } from '../repositories/product-repository';

export const DEFAULT_FEEDBACK_PAGE_SIZE = 10;

const UNKNOWN_AUTHOR_FIRST_NAME = 'Pessoa';

/** Média (uma casa decimal) e total a partir da contagem por nota. */
export function summarize(distribution: ScoreDistribution): FeedbackSummary {
  let count = 0;
  let weightedScore = 0;

  for (const score of FEEDBACK_SCORES) {
    count += distribution[score];
    weightedScore += score * distribution[score];
  }

  const average = count === 0 ? null : Math.round((weightedScore / count) * 10) / 10;

  return { average, count, distribution: { ...distribution } };
}

function toFeedback(record: FeedbackRecord, author: AccountName | undefined): Feedback {
  return {
    id: record.id,
    score: record.score,
    comment: record.comment,
    createdAt: record.createdAt,
    author: {
      id: record.authorId,
      firstName: author?.firstName ?? UNKNOWN_AUTHOR_FIRST_NAME,
      lastName: author?.lastName ?? '',
    },
  };
}

type FeedbackServiceDeps = {
  feedbacks: FeedbackRepository;
  products: ProductRepository;
  accounts: AccountRepository;
};

export function createFeedbackService({ feedbacks, products, accounts }: FeedbackServiceDeps) {
  async function assertProductExists(productId: string): Promise<void> {
    if (!(await products.exists(productId))) {
      throw new AppError('NOT_FOUND', 'Produto não encontrado');
    }
  }

  return {
    async listByProduct({
      productId,
      cursor,
      limit = DEFAULT_FEEDBACK_PAGE_SIZE,
    }: FeedbackListInput): Promise<FeedbackListOutput> {
      const after = cursor ? decodeKeysetCursor(cursor) : undefined;

      if (after === null) {
        throw new AppError('BAD_REQUEST', 'Cursor inválido');
      }

      await assertProductExists(productId);

      const [rows, distribution] = await Promise.all([
        feedbacks.listByProduct(productId, { limit: limit + 1, after }),
        feedbacks.countByScore(productId),
      ]);

      const page = paginate(rows, limit, (record) => ({
        createdAt: record.createdAt,
        id: record.id,
      }));
      const authorIds = [...new Set(page.items.map((record) => record.authorId))];
      const authors = new Map(
        (await accounts.findNamesByIds(authorIds)).map((author) => [author.id, author]),
      );

      return {
        items: page.items.map((record) => toFeedback(record, authors.get(record.authorId))),
        nextCursor: page.nextCursor,
        summary: summarize(distribution),
      };
    },

    async create(input: CreateFeedbackInput, author: AccountName): Promise<Feedback> {
      await assertProductExists(input.productId);

      const record = await feedbacks.create({
        productId: input.productId,
        authorId: author.id,
        score: input.score,
        comment: input.comment,
      });

      return toFeedback(record, author);
    },
  };
}

export type FeedbackService = ReturnType<typeof createFeedbackService>;
