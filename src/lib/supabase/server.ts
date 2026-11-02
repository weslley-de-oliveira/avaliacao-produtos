import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }

  return value;
}

/**
 * Cliente administrativo do Supabase (service role).
 *
 * Deve ser usado apenas no servidor: a service role ignora as políticas de RLS
 * e por isso nunca pode ser exposta ao browser. É o cliente usado para criar
 * contas, já que a tabela `accounts` não é acessível anonimamente.
 */
export function createSupabaseAdminClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
