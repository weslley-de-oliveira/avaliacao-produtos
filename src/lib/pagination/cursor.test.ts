import { describe, expect, it } from 'vitest';
import { decodeCursor, decodeKeysetCursor, encodeCursor, paginate } from './cursor';

const encodeRaw = (value: unknown) =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

describe('cursor', () => {
  it('codifica e decodifica o payload de ida e volta', () => {
    const payload = { createdAt: '2026-01-01T00:00:00.000Z', id: 'abc_123' };

    expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
  });

  it('rejeita cursor que não é base64 de um JSON válido', () => {
    expect(decodeCursor('não-é-cursor')).toBeNull();
    expect(decodeCursor(encodeRaw({ createdAt: 1, id: 'x' }))).toBeNull();
  });

  describe('decodeKeysetCursor', () => {
    it('normaliza a data para ISO 8601 em UTC', () => {
      const cursor = encodeRaw({ createdAt: '2026-01-01T03:00:00+03:00', id: 'abc' });

      expect(decodeKeysetCursor(cursor)).toEqual({
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'abc',
      });
    });

    it('bloqueia id com caracteres que injetariam operadores no filtro', () => {
      const cursor = encodeRaw({
        createdAt: '2026-01-01T00:00:00.000Z',
        id: 'x",id.gt."',
      });

      expect(decodeKeysetCursor(cursor)).toBeNull();
    });

    it('rejeita data inválida', () => {
      const cursor = encodeRaw({ createdAt: 'ontem', id: 'abc' });

      expect(decodeKeysetCursor(cursor)).toBeNull();
    });
  });

  describe('paginate', () => {
    const rows = [1, 2, 3].map((n) => ({
      id: `id-${n}`,
      createdAt: `2026-01-0${n}T00:00:00.000Z`,
    }));
    const toCursor = (row: (typeof rows)[number]) => row;

    it('usa a linha extra só para indicar a próxima página', () => {
      const page = paginate(rows, 2, toCursor);

      expect(page.items).toEqual(rows.slice(0, 2));
      expect(decodeCursor(page.nextCursor ?? '')).toEqual(rows[1]);
    });

    it('não gera cursor quando não há próxima página', () => {
      expect(paginate(rows, 3, toCursor).nextCursor).toBeNull();
      expect(paginate([], 3, toCursor)).toEqual({ items: [], nextCursor: null });
    });
  });
});
