/**
 * Erros de domínio, independentes de transporte.
 *
 * Serviços lançam `AppError`; a borda (middleware do tRPC e adaptadores REST)
 * traduz o `code` para o protocolo. Assim as regras de negócio não conhecem
 * tRPC nem HTTP.
 */
export type AppErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT';

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Lançado por repositórios quando uma restrição de unicidade é violada. O
 * serviço decide qual mensagem de negócio isso representa.
 */
export class DuplicateRecordError extends Error {
  constructor(readonly constraint?: string) {
    super('Registro duplicado');
    this.name = 'DuplicateRecordError';
  }
}

/**
 * Falha de infraestrutura ao acessar o armazenamento. A mensagem é genérica de
 * propósito: detalhes do banco ficam em `cause` para log, nunca na resposta.
 */
export class RepositoryError extends Error {
  constructor(operation: string, options?: { cause?: unknown }) {
    super(`Falha ao ${operation}`, options);
    this.name = 'RepositoryError';
  }
}
