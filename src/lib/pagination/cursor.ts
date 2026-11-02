export type CursorPayload = {
  createdAt: string;
  id: string;
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as CursorPayload).createdAt !== 'string' ||
      typeof (parsed as CursorPayload).id !== 'string'
    ) {
      return null;
    }

    return parsed as CursorPayload;
  } catch {
    return null;
  }
}

/**
 * Decodifica e valida o conteúdo do cursor de keyset.
 *
 * O cursor é opaco para o cliente, mas os valores entram no filtro do
 * PostgREST: só aceitamos uma data válida (normalizada para ISO 8601) e um id
 * no formato gerado pelo `nanoid`, o que impede injeção de operadores.
 */
export function decodeKeysetCursor(cursor: string): CursorPayload | null {
  const payload = decodeCursor(cursor);

  if (!payload || !ID_PATTERN.test(payload.id)) {
    return null;
  }

  const createdAt = new Date(payload.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return { createdAt: createdAt.toISOString(), id: payload.id };
}

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

/**
 * Fecha uma página de keyset a partir de `limit + 1` linhas: a linha extra só
 * indica que existe próxima página e não é devolvida.
 */
export function paginate<T>(
  rows: T[],
  limit: number,
  toCursor: (row: T) => CursorPayload,
): Page<T> {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasNextPage && lastItem ? encodeCursor(toCursor(lastItem)) : null,
  };
}
