## Arquitetura do Projeto

## Front-End

    - Typescript: Linguagem principal de desenvolvimento
    - Next.js: Framework para criação e gestão de interfaces
    - React.js: Biblioteca para criação e componentização de interfaces
    - Biome: Validação/formatação/correção de código (lint)
    - TailWindCSS: Estilização
    - Date-FNS: Manipulação de data/hora
    - Shadcn: Componentização base (design system)
    - React Query: Criação e gestão de queries para ler dados da API e mutations para alterar dados

## Back-End

    - Typescript: Linguagem principal de desenvolvimento
    - Next.js: Framework para criação de APIs
    - Bcryptjs: Geração de salt + hash da senha
    - Mastra.ai: Criação e customização de agentes internos
    - TRPC: Gestão de endpoints
    - Zod: Validação compartilhada entre cliente e servidor
    - Vitest: Testes automatizados

## Banco de Dados

    - Supabase: PostgreSQL

## Infraestrutura

    - Vercel: Hospedar tanto o servidor (API) quanto o cliente (SPA)

## Automação

    - N8N: Criação de fluxos automatizados (importação de produtos)

## Camadas do back-end

O back-end segue uma arquitetura em camadas com injeção de dependência. Cada
camada só conhece a de baixo, por meio de interfaces:

```text
HTTP (REST /api/v1/*)  ─┐
                        ├─▶ tRPC (routers) ─▶ Serviços ─▶ Repositórios ─▶ Supabase
Cliente (React Query) ──┘        │               │              │
                          validação Zod     regras de       acesso a dados
                          + sessão          negócio         e mapeamento
```

    - Adaptadores REST (src/app/api/v1): traduzem HTTP ↔ procedimento tRPC via
      `createServerCaller()`. Não contêm regra de negócio. Erros são convertidos
      por um único `toErrorResponse()` (src/server/http/responses.ts).
    - Routers tRPC (src/server/api/routers): validam o input com Zod, aplicam a
      autenticação (`protectedProcedure`) e delegam ao serviço do contexto.
    - Serviços (src/server/services): regras de negócio (paginação, resumo de
      notas, login sem vazar quais emails existem, conflitos). Não conhecem
      tRPC, HTTP nem Supabase; lançam `AppError` com um código de domínio.
    - Repositórios (src/server/repositories): interfaces (`ProductRepository`,
      `FeedbackRepository`, `AccountRepository`) e suas implementações Supabase.
      São o único lugar que conhece tabelas, colunas e códigos do PostgreSQL.
    - Raiz de composição (src/server/container.ts): liga serviços às
      implementações concretas (Supabase, bcrypt). Os serviços chegam aos
      routers pelo contexto do tRPC; os testes usam repositórios em memória.

### Princípios aplicados

    - Responsabilidade única: transporte, regra de negócio e acesso a dados
      ficam em camadas separadas.
    - Inversão de dependência: serviços dependem de interfaces de repositório e
      de `PasswordHasher`, não de Supabase ou bcrypt.
    - Aberto/fechado no tratamento de erros: `AppError` → tRPC (middleware
      `errorBoundary`) → HTTP (`toErrorResponse`, baseado no mapeamento do
      próprio tRPC). Um código novo não exige editar cada rota.
    - Erros inesperados nunca expõem detalhes do banco: viram uma mensagem
      genérica e o erro original vai para o log do servidor.

### Autorização e imagens

    - Contas têm `role` (`user` | `admin`). `assertAdmin()`
      (src/server/auth/authorization.ts) é a regra única: usada pelo
      `adminProcedure` do tRPC e pela rota de upload, que não passa pelo tRPC.
    - Upload: `POST /api/v1/product-images` → `ProductImageService` valida
      tamanho e tipo pelos magic bytes (não pelo Content-Type do cliente) e
      grava via a interface `ImageStorage` (implementação Supabase Storage,
      bucket público `product-images`). O nome do arquivo é gerado no servidor.
    - `src/lib/images/product-images.ts` é a fonte única dos domínios de
      imagem: alimenta os `remotePatterns` do `next.config.ts` e a validação do
      `imageUrl`, então uma URL que quebraria o `next/image` é recusada na API.

### Resumo das avaliações por IA

    - `ReviewSummarizer` (src/server/ai) é a porta usada pelo
      `ReviewSummaryService`; a implementação chama o `reviewSummaryAgent` do
      Mastra (src/mastra), carregado sob demanda.
    - Cache em `product_review_summaries`: o resumo é reaproveitado enquanto o
      total de avaliações não muda; ao mudar, é gerado de novo com as 200
      avaliações mais recentes.
    - Modelo padrão: `google/gemini-3.1-flash-lite` (plano gratuito), trocável por
      `AI_SUMMARY_MODEL`; o raciocínio do Gemini é desligado no resumo para não
      consumir o limite de saída.
    - Falha ou ausência da IA (sem a chave do provedor) não quebra a página:
      devolve o último resumo salvo ou o estado `unavailable`.
    - Após uma falha do modelo, o produto fica 5 minutos sem nova tentativa
      (pausa por instância): a página responde na hora em vez de esperar o
      provedor recusar de novo. O agente não faz novas tentativas internas.
    - Os comentários são dados de usuários: entram como JSON, com `<`/`>`
      escapados, dentro de um bloco delimitado, e o agente é instruído a não
      seguir instruções escritas neles.

### Decisões

    - Os contratos REST seguem as specs e não foram unificados: `GET
      /api/v1/products` responde um array com o cursor no header
      `X-Next-Cursor` (a spec pede array), enquanto as rotas de detalhe usam
      `{ data }`. O workflow do n8n depende desse formato.
    - Paginação por keyset (`created_at desc, id desc`) com cursor opaco. O
      conteúdo do cursor é validado antes de entrar no filtro do PostgREST.
    - Sessão própria em cookie httpOnly assinado com HMAC-SHA256; a assinatura
      é comparada em tempo constante.
    - O cliente Supabase usa a service role e roda só no servidor; RLS fica
      ligado sem policies públicas.

## Estrutura do código

    - src/app: rotas e páginas (App Router) e handlers HTTP
        - src/app/api/trpc/[trpc]: handler tRPC
        - src/app/api/v1: adaptadores REST (delegam para o tRPC)
    - src/components: componentes por feature (auth, products, feedback) e
      src/components/ui com a base do Shadcn
    - src/lib: código compartilhado entre cliente e servidor (schemas Zod,
      cursor de paginação, sessão, tipos)
    - src/server
        - api: inicialização do tRPC, router raiz, routers e caller do servidor
        - services: regras de negócio
        - repositories: interfaces e implementações Supabase
        - storage: interface de armazenamento de imagens (Supabase Storage)
        - ai: porta do resumo por IA e adaptador do Mastra
        - http: tradução de erros e utilitários das rotas REST
        - auth: conta autenticada da requisição e autorização (admin)
        - security: hash de senha
        - testing: repositórios em memória para os testes
    - src/trpc: client/provider do tRPC + React Query
    - src/mastra: agentes de IA (resumo das avaliações e suporte)
    - database: schema, migrações e seed SQL
    - n8n: workflow de importação de produtos (sem credenciais)

## Comandos

    - npm run dev: servidor de desenvolvimento
    - npm run build / npm run start: build e execução em produção
    - npm run test: testes (Vitest)
    - npm run test:watch: testes em modo observação
    - npm run lint: verificação com Biome
    - npm run lint:fix: verificação + correções automáticas
    - npm run format: formatação com Biome
    - npm run typecheck: checagem de tipos (tsc --noEmit)
