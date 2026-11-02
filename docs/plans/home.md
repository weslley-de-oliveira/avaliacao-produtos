# Plano — Home (Listagem de Produtos)

## 1. Objetivo

Transformar a home em um catálogo público de produtos, com listagem paginada
por infinite scroll, cards com imagem e nome, e navegação para a página de
detalhes de cada produto (onde fica a descrição). Entregar também o modelo de dados e os
endpoints de leitura e inserção manual.

## 2. Leitura da spec e decisões

- Rota pública `/`, sem autenticação.
- `GET /api/v1/products` retorna `200` com lista (possivelmente vazia).
- Infinite scroll com paginação por cursor (melhor que offset para inserções
  manuais e para performance).
- Tabela `products` com os campos da spec + `image_url`, que falta no modelo mas
  é exigida na listagem e no POST.
- `score` permanece `boolean`, conforme a spec; fica reservado e não é usado
  como nota. A nota real virá da média de `products_feedbacks.score`.
- `POST /api/v1/products` é uma operação manual/administrativa e exigirá sessão
  (`protectedProcedure`). O seed SQL permite demonstrar a home sem depender
  desse endpoint. A spec escreve `POST /products`; seguimos o prefixo
  `/api/v1` já usado pelo projeto.
- A página de detalhes é da feature Feedback (`/products/[id]`). A Home apenas
  linka para ela e fornece `products.byId` como contrato.
- A home atual (que renderiza o sign-up) será substituída. O formulário de
  sign-up continua acessível em `/auth/sign-up`.

## 3. Escopo

### Dentro

- Migration `products`.
- Seed com produtos de exemplo.
- Endpoint REST `GET /api/v1/products` com cursor.
- Endpoint REST `GET /api/v1/products/[id]`.
- Endpoint REST `POST /api/v1/products` (protegido).
- Router tRPC `products` com `list`, `byId` e `create`.
- Home pública com hero, grid responsivo, skeletons, empty/error states e
  infinite scroll.
- Cards clicáveis para `/products/[id]`.
- Metadados da página.

### Fora

- Página de detalhes (Feedback).
- Filtros, busca, ordenação e categorias.
- Edição/exclusão de produtos.
- Upload de imagem (usa URL externa).
- Avaliações na home (a Home não depende da tabela de feedbacks).
- Painel administrativo.

## 4. Modelo de dados

### Migration `database/migrations/20261029000100_create_products.sql`

```sql
create table if not exists products (
  id text primary key,
  name text not null,
  description text,
  image_url text,
  external_link text not null,
  score boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_created_at_id
  on products (created_at desc, id desc);

alter table products enable row level security;
```

- `id`: `nanoid()` gerado na API.
- `name`: obrigatório, sem limite de tamanho.
- `description`: opcional, sem limite de tamanho.
- `image_url`: opcional, URL `http(s)`.
- `external_link`: obrigatório, URL `http(s)`, único (constraint
  `products_external_link_key`, migration
  `20261102000100_add_products_external_link_unique.sql`).
- `score`: boolean reservado, default `false`.
- `created_at`/`updated_at`: timestamptz.
- Trigger `update_products_updated_at` reutilizando
  `update_updated_at_column()` (criar com `create or replace` para ser
  idempotente).
- RLS habilitado sem policies públicas: todo acesso passa pelo servidor com
  service role.
- `database/schema.sql` não é editado por esta feature; o orquestrador consolida
  na Fase 2.

### Seed `database/seed.sql`

- 10 produtos de exemplo em português, com nome, descrição curta, imagem
  (Unsplash) e link externo.
- `insert ... on conflict (id) do nothing` para ser idempotente.
- IDs fixos legíveis (ex.: `seed-fone-aurora`) para facilitar testes.
- Imagens com URLs estáveis do Unsplash; `images.unsplash.com` configurado em
  `next.config.ts` pelo Sign-In/Orquestrador.

## 5. Contratos de API

### `GET /api/v1/products`

Query:

| Param | Tipo | Default | Regra |
| --- | --- | --- | --- |
| `cursor` | string opaca | — | Base64url de `created_at|id` |
| `limit` | int | `12` | Entre 1 e 24 |

Resposta `200` (array, para aderir literalmente à spec):

```json
[
  {
    "id": "abc",
    "name": "Fone Aurora",
    "description": "Fone sem fio com cancelamento de ruído.",
    "imageUrl": "https://images.unsplash.com/...",
    "externalLink": "https://exemplo.com/fone",
    "score": false,
    "createdAt": "2026-10-29T12:00:00.000Z",
    "updatedAt": "2026-10-29T12:00:00.000Z"
  }
]
```

- Lista vazia: `[]`.
- Paginação via header `X-Next-Cursor` (omitido quando não há próxima página).
- O router tRPC `products.list` retorna `{ items, nextCursor }` para a UI; o
  adaptador REST converte para array + header.
- Ordenação: `created_at desc, id desc`.
- `limit + 1` para saber se há próxima página.
- `400` para cursor/limit inválidos; `500` para falha inesperada.
- `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` (catálogo
  público; ajustar se necessário).

### Importação automática (n8n)

Além do `POST` manual, um workflow do n8n (`docker-compose.yml`) importa
produtos de uma loja externa:

1. Login em `POST /api/trpc/auth.signIn?batch=1` e leitura do cookie
   `av_session` do `Set-Cookie`.
2. Scraping da coleção da loja e montagem de `name`, `externalLink`,
   `imageUrl` (URLs absolutas) e `description` (conteúdo de
   `.product-card__info`, uma informação por linha).
3. Leitura de todas as páginas de `GET /api/v1/products` (via
   `X-Next-Cursor`) e descarte dos produtos cujo `externalLink` já existe.
4. `POST /api/v1/products` com o cookie. O nó continua em caso de erro; um
   `409` (link duplicado) não interrompe os demais itens.

As imagens da loja exigem o host em `images.remotePatterns`
(`brazil.nothingprojector.com`, caminho `/cdn/shop/**`).

### `GET /api/v1/products/[id]`

- `200 { "data": Product }`
- `404 { "error": "Produto não encontrado" }`
- Usado pela página de detalhes da feature Feedback.

### `POST /api/v1/products`

Restrito a administradores (`adminProcedure`, `accounts.role = 'admin'`).
O `imageUrl` só aceita domínios liberados no `next.config.ts`; imagens novas
são enviadas antes por `POST /api/v1/product-images`. Body:

```json
{
  "name": "Fone Aurora",
  "description": "Fone sem fio com cancelamento de ruído.",
  "imageUrl": "https://images.unsplash.com/...",
  "externalLink": "https://exemplo.com/fone"
}
```

- `201 { "data": Product }`
- `400 { "error": "Dados inválidos", "details": {...} }`
- `401 { "error": "Autenticação necessária" }`
- `403 { "error": "Apenas administradores podem cadastrar produtos" }`
- `409 { "error": "Já existe um produto com este link externo" }`
- `500 { "error": "Não foi possível criar o produto" }`
- `id`, `createdAt` e `updatedAt` são gerados no servidor; `score` default
  `false`.

### tRPC

- `products.list({ cursor?, limit? })` → `{ items: Product[], nextCursor }`.
- `products.byId({ id })` → `Product | null`.
- `products.create(input)` → `Product` (protegido).

A UI usa `products.list` com `useInfiniteQuery`. Os adaptadores REST delegam ao
mesmo router para não duplicar regra.

## 6. UI/UX

### Direção visual

A home deve ser o “balcão de catálogo” da mesma família visual do sign-up:
branco (`paper`) como base predominante, preto (`ink`) como bloco editorial,
vermelho (`brand` e `accent`) nos detalhes, tipografia display Bricolage
Grotesque, cantos retos, bordas finas escuras e o
corte `ticket-clip` como assinatura. Evitar o kit genérico de cards arredondados
com sombra suave.

- Grid de 3 colunas no desktop, 2 no tablet, 1 no mobile.
- Cards só com imagem e nome. A imagem ocupa toda a largura do card e a altura
  segue a proporção original, sem corte; a descrição aparece apenas na página
  de detalhes.
- Um detalhe gráfico recorrente: uma pequena barra vertical `accent` ou uma
  fileira de traços de “nota” ao lado do nome. Não usar numeração 01/02/03,
  pois os produtos não são uma sequência.
- Sombra dura deslocada (`brand-deep`) apenas em elementos de destaque, como o
  hero e o card em hover/focus, mantendo o resto quieto.

### Wireframe — desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ▮▮▮ Avaliação de Produtos            Produtos              [ Entrar ] │
├──────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │  Leia antes de comprar.                                          │ │
│ │  Avalie depois de usar.                                          │ │
│ │                                                                  │ │
│ │  Produtos avaliados por quem já testou.      ▮▮▮▮▮               │ │
│ │  [ Explorar produtos ]                                           │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Produtos                                        10 no catálogo      │
│  ──────────────────────────────────────────────────────────────────  │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                      │
│  │  imagem    │  │  imagem    │  │  imagem    │                      │
│  │            │  │            │  │            │                      │
│  ├────────────┤  ├────────────┤  ├────────────┤                      │
│  │ ▮ Nome     │  │ ▮ Nome     │  │ ▮ Nome     │                      │
│  └────────────┘  └────────────┘  └────────────┘                      │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                      │
│  │   ...      │  │   ...      │  │   ...      │                      │
│  └────────────┘  └────────────┘  └────────────┘                      │
│                        [ sentinela ]                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Wireframe — mobile

```text
┌──────────────────────────┐
│ ▮▮▮ Produtos      [Entrar]│
├──────────────────────────┤
│ Leia antes de comprar.   │
│ Avalie depois de usar.   │
│ [ Explorar produtos ]    │
│                          │
│ Produtos                 │
│ ┌──────────────────────┐ │
│ │       imagem         │ │
│ │ ▮ Nome               │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │       imagem         │ │
│ └──────────────────────┘ │
│        [ sentinela ]     │
└──────────────────────────┘
```

### Componentes

- `src/app/page.tsx`: server component com metadata; renderiza o hero e o
  catálogo.
- `src/components/products/home-hero.tsx`: bloco editorial preto (`ink`).
- `src/components/products/product-catalog.tsx`: client component com
  `useInfiniteQuery`, IntersectionObserver e estados.
- `src/components/products/product-card.tsx`: card com imagem e nome, ambos
  com `Link` para `/products/[id]`.
- `src/components/products/product-grid-skeleton.tsx`: skeletons no mesmo
  ritmo do grid.
- `src/components/products/product-empty-state.tsx`: convite para voltar mais
  tarde; mencionar que o catálogo é alimentado manualmente.
- `src/components/products/product-image.tsx`: imagem em largura total com a
  altura pela proporção original (sem `fill`); fallback 4:3 com iniciais quando
  `imageUrl` é nulo ou falha.
- `src/lib/validations/product.ts`: schemas Zod e tipos compartilhados.
- `src/lib/pagination/cursor.ts`: helper compartilhado da Fase 0 para
  encode/decode do cursor opaco.
- `src/server/api/routers/products.ts`: `list`, `byId`, `create`.
- `src/app/api/v1/products/route.ts`: GET e POST.
- `src/app/api/v1/products/[id]/route.ts`: GET.

### Estados

- **Loading inicial**: 6 skeletons.
- **Carregando mais**: 3 skeletons ao final + `aria-busy`.
- **Vazio**: “Nenhum produto por aqui ainda.” e texto explicando que o catálogo
  é curado manualmente.
- **Erro**: bloco com “Não foi possível carregar os produtos.” e botão
  “Tentar novamente”.
- **Fim da lista**: mensagem discreta “Você chegou ao fim do catálogo.” quando
  `hasNextPage === false` e há itens.
- **Imagem quebrada**: fallback com iniciais do produto em `accent` sobre fundo
  `ink`.
- **Descrição ausente**: o card não exibe descrição; a página de detalhes
  mostra “Sem descrição.”.
- **Acessibilidade**: cards com link no nome e na imagem; `alt` descritivo;
  foco visível; `aria-live` para carregamento/erro; respeitar
  `prefers-reduced-motion`.

### Copy

- Hero: “Leia antes de comprar. Avalie depois de usar.”
- Apoio: “Produtos avaliados por quem já testou.”
- CTA: “Explorar produtos” (âncora para o grid).
- Vazio: “Nenhum produto por aqui ainda. O catálogo é atualizado manualmente.”

## 7. Arquivos

### Criados

- `database/migrations/20261029000100_create_products.sql`
- `database/seed.sql`
- `src/lib/validations/product.ts`
- `src/server/api/routers/products.ts`
- `src/app/api/v1/products/route.ts`
- `src/app/api/v1/products/[id]/route.ts`
- `src/app/page.tsx` (substitui o conteúdo atual)
- `src/components/products/home-hero.tsx`
- `src/components/products/product-catalog.tsx`
- `src/components/products/product-card.tsx`
- `src/components/products/product-grid-skeleton.tsx`
- `src/components/products/product-empty-state.tsx`
- `src/components/products/product-image.tsx`

### Somente leitura

- `src/app/layout.tsx` (header do Sign-In)
- `src/components/site-header.tsx`
- `src/server/api/trpc.ts`
- `src/server/api/root.ts`
- `src/lib/auth/**`
- `src/components/ui/*`
- `src/app/globals.css`
- `tailwind.config.ts`
- `next.config.ts`
- `database/schema.sql`
- `package.json`

## 8. Passos de implementação

1. Criar a migration `products` com índice, trigger e RLS.
2. Criar o seed com 10 produtos de exemplo.
3. Implementar schemas Zod e consumir o helper de cursor compartilhado da
   Fase 0.
4. Implementar `productsRouter` com `list`, `byId` e `create` (este protegido).
5. Implementar os adaptadores REST GET/POST e GET by id.
6. Substituir `src/app/page.tsx` pela home.
7. Criar hero, grid, card, skeletons, empty/error states.
8. Implementar infinite scroll com `useInfiniteQuery` +
   `IntersectionObserver`, usando `nextCursor`.
9. Ajustar responsividade, acessibilidade e fallback de imagem.
10. Rodar `npm run typecheck` e `npm run lint`.
11. Smoke test manual:
    - home pública sem sessão;
    - seed aparece;
    - scroll carrega mais;
    - clique no nome/imagem navega para `/products/[id]`;
    - `GET /api/v1/products` retorna `200` com array (vazio quando não há dados);
    - `POST /api/v1/products` sem sessão retorna `401`; com sessão cria.

## 9. Performance

- Paginação por cursor e `limit` máximo de 24.
- `next/image` com `sizes` adequados ao grid; `loading="lazy"` para cards fora
  da primeira dobra.
- Sem dependência de bibliotecas de scroll; IntersectionObserver nativo.
- Query tRPC com `staleTime` curto (ex.: 30s) e `refetchOnWindowFocus: false`.
- Evitar renderizar todos os itens de uma vez; o grid cresce por página.

## 10. Dependências e paralelismo

- Consome da Fase 0: `createTRPCContext`, `protectedProcedure`, router raiz com
  `productsRouter`, tipos de produto.
- Depende do header do Sign-In apenas visualmente; não edita `layout.tsx`.
- Fornece para Feedback: `products.byId`, `GET /api/v1/products/[id]` e o tipo
  `Product`.
- Não depende da tabela `products_feedbacks`; a home não mostra notas.
- A migration de produtos deve ser aplicada antes da migration de feedbacks.

## 11. Critérios de aceitação → evidência

| Critério | Evidência |
| --- | --- |
| Home lista todos os produtos | Grid com infinite scroll |
| Paginação com infinite loading | `useInfiniteQuery` + IntersectionObserver |
| Título, imagem e descrição | `ProductCard` |
| Tabela `products` criada | Migration + seed |
| `GET /api/v1/products` | Adaptador REST com `200` e array (vazio quando não há dados) |
| Clique no nome navega | `Link` para `/products/[id]` |
| Endpoint manual de inserção | `POST /api/v1/products` |
| Acesso público | Nenhuma checagem de sessão no GET/home |

## 12. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Cursor inconsistente | Cursor opaco `created_at|id` + ordenação determinística |
| Imagens externas indisponíveis | Fallback visual com iniciais; `remotePatterns` configurado |
| Conflito com a Home antiga | Substituição explícita de `src/app/page.tsx` (owner: Home) |
| `score boolean` ambíguo | Manter conforme spec e documentar que a nota vem dos feedbacks |
| POST sem autorização | Restrito a administradores (`role = 'admin'`); seed cobre a demo |
| Migration fora de ordem | Nome com timestamp fixo e ordem documentada |

## 13. Definition of Done

- Migration e seed prontos e aplicáveis.
- Home pública funcional com infinite scroll e estados.
- Endpoints REST e tRPC implementados.
- Typecheck, lint e build passando.
- Nenhum arquivo de outra feature alterado.
- Relatório final entregue ao orquestrador.
