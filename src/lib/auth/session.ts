import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'av_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error('Variável de ambiente obrigatória não definida: AUTH_SESSION_SECRET');
  }

  return secret;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/**
 * Gera o token `payload.assinatura` (HMAC-SHA256) da sessão. Função pura: o
 * segredo e o instante atual são parâmetros, o que permite testá-la isolada.
 */
export function createSessionToken(
  accountId: string,
  { secret, now = Date.now() }: { secret: string; now?: number },
): string {
  const payload: SessionPayload = { sub: accountId, exp: now + SESSION_MAX_AGE_SECONDS * 1000 };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

  return `${body}.${sign(body, secret)}`;
}

/**
 * Valida assinatura (comparação em tempo constante) e expiração do token.
 * Retorna o id da conta ou `null` para qualquer token inválido.
 */
export function readSessionToken(
  token: string,
  { secret, now = Date.now() }: { secret: string; now?: number },
): string | null {
  const [body, signature] = token.split('.');

  if (!body || !signature) {
    return null;
  }

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(sign(body, secret));

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;

    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }

    return payload.exp > now ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function createSession(accountId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(accountId, { secret: getSecret() }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSessionAccountId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return readSessionToken(token, { secret: getSecret() });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS };
