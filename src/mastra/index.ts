import { Mastra } from '@mastra/core';
import { supportAgent } from './agents/support-agent';

let mastraInstance: Mastra | undefined;

/**
 * Instância do Mastra criada sob demanda (lazy).
 *
 * Não é importada por nenhuma rota da aplicação: o sign-up não depende de
 * agentes. Importe `getMastra()` apenas em fluxos internos/automatizados.
 */
export function getMastra(): Mastra {
  if (!mastraInstance) {
    mastraInstance = new Mastra({
      agents: { supportAgent },
    });
  }

  return mastraInstance;
}

export { supportAgent };
