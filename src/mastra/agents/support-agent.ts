import { Agent } from '@mastra/core/agent';

/**
 * Agente interno de suporte (scaffold).
 *
 * Este módulo é intencionalmente isolado do fluxo HTTP da aplicação: o escopo
 * atual (sign-up) não expõe nenhuma rota de agente. Use-o a partir de rotas ou
 * fluxos internos quando houver um caso de uso concreto.
 *
 * Requer `OPENAI_API_KEY` no ambiente para executar chamadas de modelo.
 */
export const supportAgent = new Agent({
  id: 'support-agent',
  name: 'Support Agent',
  instructions: `Você é o agente interno de suporte do Módulo de Engajamento de Avaliação de Produtos.
Responda em português do Brasil, de forma objetiva e cordial.
Nunca solicite ou exponha senhas, hashes ou chaves de acesso.
Se não souber a resposta, informe que vai encaminhar o caso para o time responsável.`,
  model: 'openai/gpt-4o-mini',
});
