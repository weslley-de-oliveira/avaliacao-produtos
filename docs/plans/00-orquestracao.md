# Orquestração — Sign-In, Home e Feedback

Este documento define como as três features serão executadas em paralelo sem
conflitos de arquivos. Os planos individuais estão em:

- `docs/plans/sign-in.md`
- `docs/plans/home.md`
- `docs/plans/feedback.md`

## Estratégia de execução

1. **Aprovação dos planos** (etapa atual).
2. **Fase 0 — Contratos compartilhados (orquestrador)**: criar a base de sessão,
   contexto tRPC, `protectedProcedure`, tipos/contratos e wiring do router raiz.
3. **Fase 1 — Três subagents em paralelo**: um por feature, cada um com
   propriedade exclusiva dos seus arquivos.
4. **Fase 2 — Integração (orquestrador)**: consolidar `database/schema.sql`,
   rodar migrations/seed, `typecheck`, `lint`, `build` e smoke tests.
5. **Fase 3 — Correções e entrega**: corrigir apenas o que a integração apontar,
   sem reabrir escopo.

## Contratos compartilhados (Fase 0)

### Sessão

- Cookie `av_session`, assinado com HMAC-SHA256 usando `AUTH_SESSION_SECRET`.
- Payload `{ sub: accountId, exp: timestamp }`, codificado em base64url.
- Atributos: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` em produção,
  `Max-Age` de 7 dias.
- Helpers em `src/lib/auth/session.ts`:
  - `createSession(accountId)`
  - `getSessionAccountId()`
  - `destroySession()`
- `src/server/auth/current-account.ts`:
  - `getCurrentAccount()` — lê a sessão, busca a conta ativa pelo serviço de
    autenticação e retorna `SessionAccount | null`. Usa `cache()` do React para
    evitar consultas repetidas na mesma requisição.
- `src/lib/auth/session-account.ts`: tipo
  `SessionAccount = { id, firstName, lastName, email }`, compartilhado com a UI.
- `AUTH_SESSION_SECRET` adicionada ao `.env.example` e ao `.env.local` local
  (nunca commitada). Valor com pelo menos 32 caracteres aleatórios.

### tRPC

- `src/server/api/trpc.ts` passa a ter contexto:
  ```ts
  type Context = { account: SessionAccount | null; services: Services };
  ```
- `createTRPCContext()` resolve `getCurrentAccount()` e injeta os serviços
  montados em `src/server/container.ts` (ver `docs/ARCHITECTURE.md`).
- `publicProcedure` permanece público.
- `protectedProcedure` lança `UNAUTHORIZED` quando `ctx.account` é `null`.
- O handler `src/app/api/trpc/[trpc]/route.ts` passa a usar
  `createContext: createTRPCContext`.
- Adaptadores REST usam `createServerCaller()` (`src/server/api/caller.ts`) e
  traduzem erros com `toErrorResponse()` (`src/server/http/responses.ts`).
- O adaptador existente de sign-up é ajustado para o novo contexto.

### Router raiz

`src/server/api/root.ts` reúne os routers (o cadastro é `auth.signUp`):

```ts
export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  feedbacks: feedbacksRouter,
});
```

Os arquivos `auth.ts`, `products.ts` e `feedbacks.ts` começam como stubs
mínimos na Fase 0 e são substituídos pelos respectivos subagents. Cada stub já
declara as procedures do contrato (`auth.signIn/signOut/me`,
`products.list/byId/create`, `feedbacks.listByProduct/create`) com retornos
placeholder tipados. Assim os três conseguem compilar e trabalhar em paralelo
sem editar o mesmo arquivo.

### Tipos e schemas compartilhados

- `src/lib/validations/product.ts`: schema Zod e tipos `Product`,
  `ProductListOutput`, `CreateProductInput`. Criado na Fase 0 como contrato;
  a feature Home pode evoluí-lo, mas não pode quebrar os campos usados por
  Feedback.
- `src/lib/validations/feedback.ts`: schema Zod e tipos `Feedback`,
  `FeedbackSummary`, `CreateFeedbackInput`. Criado na Fase 0 como contrato;
  a feature Feedback pode evoluí-lo.
- `src/lib/validations/sign-in.ts`: schema Zod de login. Criado na Fase 0;
  a feature Sign-In pode evoluí-lo.
- `src/lib/pagination/cursor.ts`: encode/decode de cursor opaco
  (`created_at|id`) usado por Home e Feedback. Owner: orquestrador; as features
  apenas consomem.

### Migrations

Ordem fixa, independente da ordem de término dos subagents:

1. `database/migrations/20261029000100_create_products.sql` (Home)
2. `database/migrations/20261029000200_create_products_feedbacks.sql` (Feedback)

`database/schema.sql` é consolidado apenas pelo orquestrador na Fase 2. Nenhum
subagent edita esse arquivo.

### Rotas REST

- `POST /api/v1/sign-in` (Sign-In)
- `POST /api/v1/sign-out` (Sign-In)
- `GET /api/v1/products` (Home)
- `POST /api/v1/products` (Home)
- `GET /api/v1/products/[id]` (Home)
- `GET /api/v1/products/[id]/feedbacks` (Feedback)
- `POST /api/v1/products/[id]/feedbacks` (Feedback)

### Imagens remotas

`next.config.ts` recebe `images.remotePatterns` para:

- `api.dicebear.com` (avatares)
- `images.unsplash.com` (imagens do seed de produtos)
- `brazil.nothingprojector.com`, caminho `/cdn/shop/**` (imagens dos produtos
  importados pelo workflow do n8n)

## Matriz de propriedade de arquivos

| Arquivo / pasta | Owner | Demais features |
| --- | --- | --- |
| `src/app/layout.tsx` | Sign-In | somente leitura |
| `src/app/globals.css` | Sign-In | somente leitura |
| `tailwind.config.ts` | Sign-In | somente leitura |
| `next.config.ts` | Sign-In | somente leitura |
| `src/components/site-header.tsx` | Sign-In | somente leitura |
| `src/components/auth/**` | Sign-In | somente leitura |
| `src/app/auth/sign-in/**` | Sign-In | somente leitura |
| `src/app/api/v1/sign-in/**` | Sign-In | somente leitura |
| `src/app/api/v1/sign-out/**` | Sign-In | somente leitura |
| `src/server/api/routers/auth.ts` | Sign-In | somente leitura |
| `src/lib/validations/sign-in.ts` | Sign-In | somente leitura |
| `src/app/page.tsx` | Home | somente leitura |
| `src/components/products/**` | Home | somente leitura |
| `src/app/api/v1/products/route.ts` | Home | somente leitura |
| `src/app/api/v1/products/[id]/route.ts` | Home | somente leitura |
| `src/server/api/routers/products.ts` | Home | somente leitura |
| `src/lib/validations/product.ts` | Home | somente leitura |
| `src/lib/pagination/cursor.ts` | Orquestrador | não editar |
| `database/migrations/20261029000100_create_products.sql` | Home | somente leitura |
| `database/seed.sql` | Home | somente leitura |
| `src/app/products/[id]/page.tsx` | Feedback | somente leitura |
| `src/components/feedback/**` | Feedback | somente leitura |
| `src/app/api/v1/products/[id]/feedbacks/**` | Feedback | somente leitura |
| `src/server/api/routers/feedbacks.ts` | Feedback | somente leitura |
| `src/lib/validations/feedback.ts` | Feedback | somente leitura |
| `database/migrations/20261029000200_create_products_feedbacks.sql` | Feedback | somente leitura |
| `src/server/api/root.ts` | Orquestrador | não editar |
| `src/server/api/trpc.ts` | Orquestrador | não editar |
| `src/lib/auth/**` | Orquestrador | não editar |
| `src/app/api/trpc/[trpc]/route.ts` | Orquestrador | não editar |
| `src/app/api/v1/sign-up/route.ts` | Orquestrador | não editar |
| `database/schema.sql` | Orquestrador | não editar |
| `package.json` / `package-lock.json` | Orquestrador | não editar |
| `.env.example` / `.env.local` | Orquestrador | não editar |

## Regras para os subagents

1. Trabalhar **somente** nos arquivos da coluna Owner.
2. Não instalar dependências; se algo parecer necessário, reportar ao
   orquestrador.
3. Não alterar tokens de design existentes. Reutilizar `paper`, `ink`,
   `brand`, `brand-deep`, `accent`, as fontes e o motivo `ticket-clip`.
4. Não criar componentes em `src/components/ui` sem necessidade. Preferir
   elementos nativos estilizados com Tailwind para evitar conflito.
5. Não editar `src/server/api/root.ts`, `src/server/api/trpc.ts` nem
   `src/lib/auth/**`.
6. Não editar arquivos de outra feature, mesmo que pareçam incompletos.
7. Rodar `npm run typecheck` e `npm run lint` ao final. Se o único erro for
   import de arquivo de outra feature ainda não finalizado, registrar no
   relatório e seguir; a integração resolve.
8. Entregar um relatório curto com: arquivos criados/alterados, decisões,
   comandos executados, resultados e pendências.

### Prompt base para cada subagent

```text
Você é o subagent responsável pela feature <NOME>.

Leia obrigatoriamente:
- docs/plans/00-orquestracao.md
- docs/plans/<ARQUIVO_DO_PLANO>.md

Implemente integralmente o plano da feature. Respeite a matriz de propriedade
de arquivos: altere somente os arquivos cujo Owner é <NOME>. Não edite
src/server/api/root.ts, src/server/api/trpc.ts, src/lib/auth/**, package.json,
database/schema.sql nem arquivos de outras features.

Use os contratos da Fase 0 já existentes. Se precisar de algo fora do seu
escopo, registre no relatório em vez de implementar.

Ao final, rode `npm run typecheck` e `npm run lint`, corrija os erros dos seus
próprios arquivos e entregue um relatório com:
1. arquivos criados/alterados;
2. decisões tomadas;
3. comandos e resultados;
4. pendências ou bloqueios.
```

## Critérios de integração final

- `npm run typecheck` sem erros.
- `npm run lint` sem erros.
- `npm run build` concluindo.
- Migrations aplicáveis na ordem definida.
- Seed carregando produtos.
- Fluxo manual:
  1. Home pública lista produtos com infinite scroll.
  2. Clique no produto abre `/products/[id]`.
  3. Visitante vê avaliações e o bloco de autenticação.
  4. Login em `/auth/sign-in` cria cookie e atualiza o header.
  5. Pessoa logada adiciona avaliação e ela aparece na lista.
  6. Logout remove a sessão e o formulário de avaliação.
- Nenhum segredo exposto no client.

## Decisões assumidas (ajustáveis antes da execução)

1. **Sessão própria com cookie assinado**, não Supabase Auth. A spec manda ler
   email/senha da tabela `accounts`, então o fluxo custom é o mais aderente.
2. **`products.score` permanece boolean**, conforme a spec. Ele fica reservado
   e não é usado como nota. A nota real vem da média de
   `products_feedbacks.score`.
3. **`image_url` é adicionada à tabela `products`**, pois a spec exige imagem
   na listagem e no POST, mas não a lista no modelo.
4. **`POST /api/v1/products` exige sessão** (operação manual/administrativa).
   O seed SQL cobre a demonstração sem depender do endpoint. Se preferirem o
   endpoint público para testes, basta trocar `protectedProcedure` por
   `publicProcedure`.
5. **A home é propriedade da feature Home**. A spec de Sign-In pede uma home
   vazia, mas isso conflitaria com a Home real; o Sign-In apenas redireciona
   para `/`.
6. **Detalhe do produto é propriedade da feature Feedback**, em
   `/products/[id]`. A Home apenas linka para essa rota e fornece
   `products.byId`.
