import { describe, expect, it } from 'vitest';
import { createSessionToken, readSessionToken, SESSION_MAX_AGE_SECONDS } from './session';

const secret = 'segredo-de-teste';
const now = Date.UTC(2026, 0, 1);

describe('token de sessão', () => {
  it('devolve o id da conta para um token válido', () => {
    const token = createSessionToken('conta-1', { secret, now });

    expect(readSessionToken(token, { secret, now })).toBe('conta-1');
  });

  it('rejeita token com payload adulterado', () => {
    const [, signature] = createSessionToken('conta-1', { secret, now }).split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: 'conta-admin', exp: now + 1000 }),
    ).toString('base64url');

    expect(readSessionToken(`${forgedBody}.${signature}`, { secret, now })).toBeNull();
  });

  it('rejeita token assinado com outro segredo', () => {
    const token = createSessionToken('conta-1', { secret: 'outro-segredo', now });

    expect(readSessionToken(token, { secret, now })).toBeNull();
  });

  it('rejeita token expirado', () => {
    const token = createSessionToken('conta-1', { secret, now });
    const afterExpiration = now + SESSION_MAX_AGE_SECONDS * 1000 + 1;

    expect(readSessionToken(token, { secret, now: afterExpiration })).toBeNull();
  });

  it('rejeita token malformado', () => {
    expect(readSessionToken('sem-assinatura', { secret, now })).toBeNull();
    expect(readSessionToken('', { secret, now })).toBeNull();
  });
});
