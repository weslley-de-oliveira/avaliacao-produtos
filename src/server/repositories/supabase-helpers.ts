import type { PostgrestError } from '@supabase/supabase-js';
import type { CursorPayload } from '@/lib/pagination/cursor';
import type { createSupabaseAdminClient } from '@/lib/supabase/server';
import { DuplicateRecordError, RepositoryError } from '../errors';

export type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

/** 23505 = unique_violation no PostgreSQL. */
const UNIQUE_VIOLATION = '23505';

/** Normaliza o timestamptz do Postgres (`+00:00`) para ISO 8601 em UTC (`Z`). */
export function toIsoString(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

/**
 * Filtro de keyset `(created_at, id) < cursor` para ordenação desc.
 * Os valores já chegam validados por `decodeKeysetCursor`.
 */
export function keysetFilter(after: CursorPayload): string {
  return `created_at.lt."${after.createdAt}",and(created_at.eq."${after.createdAt}",id.lt."${after.id}")`;
}

/** Converte o erro do PostgREST no erro de repositório correspondente. */
export function toRepositoryError(error: PostgrestError, operation: string): Error {
  if (error.code === UNIQUE_VIOLATION) {
    return new DuplicateRecordError(error.details ?? undefined);
  }

  return new RepositoryError(operation, { cause: error });
}
