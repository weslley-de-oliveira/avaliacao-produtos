import { z } from 'zod';

/**
 * Schema compartilhado entre cliente (react-hook-form) e servidor (tRPC/REST).
 *
 * O email é normalizado (trim + lowercase) antes da validação para que a busca
 * em `accounts` seja sempre case-insensitive. A senha não tem mínimo aqui: a
 * regra de formato pertence ao cadastro e um erro específico vazaria informação
 * sobre a senha armazenada.
 */
export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Aceita apenas caminhos internos para o redirecionamento pós-login.
 *
 * Rejeita URLs absolutas (`https://...`), protocol-relative (`//evil.com`) e
 * variações com backslash/controle que alguns navegadores normalizam para uma
 * origem externa.
 */
export function getSafeRedirectPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate?.startsWith('/')) {
    return '/';
  }

  if (candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return '/';
  }

  const hasControlCharacter = Array.from(candidate).some((character) => {
    const code = character.charCodeAt(0);

    return code < 32 || code === 127;
  });

  if (hasControlCharacter) {
    return '/';
  }

  return candidate;
}
