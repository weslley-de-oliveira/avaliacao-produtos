# Plano — Feedback (Avaliações de Produtos)

## 1. Objetivo

Criar a página pública de detalhes do produto em `/products/[id]`, exibindo as
informações do produto, a nota geral, todas as avaliações existentes e, para
pessoas autenticadas, o formulário para adicionar uma nova avaliação de 1 a 5
com comentário. Visitantes continuam vendo tudo, mas recebem um bloco pedindo
autenticação no lugar do formulário.

## 2. Leitura da spec e decisões

- Rota de detalhes `/products/[id]` (a spec escreve `/products/id`).
- Tabela `products_feedbacks` com os campos pedidos.
- `score` inteiro de 1 a 5; `comment` obrigatório.
- `created_by` vem **da sessão**, nunca do body.
- GET de avaliações é público; POST exige autenticação.
- A página lista as avaliações **antes** do formulário, conforme a spec.
- A página de detalhes é a única owner de `/products/[id]`; a Home linka para
  ela e fornece `products.byId`.
- A média e a distribuição de notas são calculadas a partir de
  `products_feedbacks` e exibidas no resumo.
- Não haverá avaliação única por pessoa/produto nesta entrega, pois a spec não
  pede. Fica documentado como possível evolução.
- “Resultado” da spec: visitante vê o produto e as avaliações, mas não consegue
  adicionar comentário.

## 3. Escopo

### Dentro

- Migration `products_feedbacks`.
- Endpoint REST `GET /api/v1/products/[id]/feedbacks`.
- Endpoint REST `POST /api/v1/products/[id]/feedbacks` (protegido).
- Router tRPC `feedbacks` com `listByProduct` e `create`.
- Página `/products/[id]` com dados do produto, resumo de notas, lista de
  avaliações, bloco de autenticação e formulário.
- Infinite scroll (ou “Carregar mais”) para avaliações.
- Estados de vazio, erro, carregando e sucesso.
- Avatar DiceBear para autoras/autores.
- Metadados da página.

### Fora

- Edição/exclusão de avaliações.
- Reações, respostas, denúncias e moderação.
- Upload de fotos na avaliação.
- Filtros/ordenação de avaliações.
- Notificação por email.
- Uma avaliação por pessoa/produto (não exigido).
- Página de “minhas avaliações”.

## 4. Modelo de dados

### Migration `database/migrations/20261029000200_create_products_feedbacks.sql`

```sql
create table if not exists products_feedbacks (
  id text primary key,
  score integer not null check (score between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 1000),
  created_at timestamptz not null default now(),
  created_by text not null references accounts(id) on delete cascade,
  product_id text not null references products(id) on delete cascade
);

create index if not exists idx_products_feedbacks_product_created
  on products_feedbacks (product_id, created_at desc, id desc);

alter table products_feedbacks enable row level security;
```

- `id`: `nanoid()` gerado na API.
- `score`: 1–5 (check no banco + Zod).
- `comment`: 1–1000 caracteres.
- `created_at`: timestamptz default now.
- `created_by`: FK para `accounts.id`, preenchido pela sessão.
- `product_id`: FK para `products.id`.
- `on delete cascade` em ambos para manter integridade; exclusão de conta não
  faz parte do escopo.
- RLS habilitado sem policies públicas; leitura/escrita via servidor com
  service role.
- `database/schema.sql` não é editado por esta feature; o orquestrador consolida
  na Fase 2.
- Ordem: esta migration roda depois da migration de `products`.

## 5. Contratos de API

### `GET /api/v1/products/[id]/feedbacks`

Query:

| Param | Tipo | Default | Regra |
| --- | --- | --- | --- |
| `cursor` | string opaca | — | Base64url de `created_at|id` |
| `limit` | int | `10` | Entre 1 e 30 |

Resposta `200`:

```json
{
  "data": [
    {
      "id": "fb_1",
      "score": 5,
      "comment": "Excelente custo-benefício.",
      "createdAt": "2026-10-29T12:00:00.000Z",
      "author": {
        "id": "acc_1",
        "firstName": "Maria",
        "lastName": "Silva"
      }
    }
  ],
  "nextCursor": null,
  "summary": {
    "average": 4.6,
    "count": 12,
    "distribution": { "1": 0, "2": 1, "3": 1, "4": 2, "5": 8 }
  }
}
```

- `404 { "error": "Produto não encontrado" }` se o produto não existir.
- Lista vazia: `{ "data": [], "nextCursor": null, "summary": { "average": null, "count": 0, "distribution": {...zeros} } }`.
- Ordenação: `created_at desc, id desc`.
- Não expor email do autor.
- `summary` pode ser calculado em query separada ou agregado no servidor.

### `POST /api/v1/products/[id]/feedbacks`

Protegido por sessão (`protectedProcedure`). Body:

```json
{ "score": 5, "comment": "Excelente custo-benefício." }
```

- `201 { "data": Feedback }`
- `400 { "error": "Dados inválidos", "details": {...} }`
- `401 { "error": "Autenticação necessária" }`
- `404 { "error": "Produto não encontrado" }`
- `500 { "error": "Não foi possível salvar a avaliação" }`
- `created_by` = `ctx.account.id`; `product_id` = param da rota; `id` =
  `nanoid()`; `created_at` = servidor.

### tRPC

- `feedbacks.listByProduct({ productId, cursor?, limit? })` →
  `{ items, nextCursor, summary }` (público).
- `feedbacks.create({ productId, score, comment })` → `Feedback` (protegido).
- A UI usa `useInfiniteQuery` para a lista e `useMutation` para criar,
  invalidando a lista e o resumo após sucesso.

## 6. UI/UX

### Direção visual

Continuar a linguagem de “ficha de avaliação”: fundo branco (`paper`), blocos
pretos (`ink`), detalhes em vermelho (`brand`, `accent`), bordas retas,
tipografia display Bricolage Grotesque e o corte `ticket-clip`. A página de
detalhes deve parecer um dossiê de produto, com a nota geral em destaque e as
avaliações como fichas empilhadas. Nada de cards arredondados genéricos.

- Hero preto (`ink`) com sombra deslocada `brand-deep`: imagem do produto em
  moldura branca com o botão “Ver na loja” logo abaixo, e etiqueta, título e
  descrição ao lado (topo da imagem alinhado ao título). A imagem mantém a
  proporção original, sem corte.
- A descrição preserva as quebras de linha (`whitespace-pre-line`): a dos
  produtos importados pelo n8n é uma ficha técnica com uma informação por
  linha. É o único lugar onde a descrição aparece.
- Coluna lateral com “Nota geral”, estrelas, quantidade e distribuição por nota
  em barras horizontais (motivo gráfico já usado no sign-up).
- Lista de avaliações em fichas de papel com avatar, nome, data, estrelas e
  comentário.
- Formulário em uma ficha branca com faixa `accent` após a lista.
- Visitante vê um bloco preto (`ink`) “Entre para avaliar” no lugar do
  formulário.

### Wireframe — desktop

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ▮▮▮ Avaliação de Produtos            Produtos          [ avatar ]    │
├──────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │                    ▮▮▮ DOSSIÊ DO PRODUTO                         │ │
│ │  ┌─────────────┐   Fone Aurora                                   │ │
│ │  │   imagem    │   Fone sem fio com cancelamento de ruído.       │ │
│ │  │             │   Marca: Aurora                                 │ │
│ │  └─────────────┘   Bateria: 30 horas                             │ │
│ │  [Ver na loja ↗]                                                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Avaliações (12)                         ┌────────────────────────┐  │
│  ──────────────────────────────────────  │ NOTA GERAL             │  │
│  ┌────────────────────────────────────┐  │ 4,6  ★★★★★            │  │
│  │ (avatar) Maria Silva · há 2 dias   │  │ 12 avaliações          │  │
│  │ ★★★★★  Excelente custo-benefício. │  │ 5 ████████████ 8       │  │
│  └────────────────────────────────────┘  │ 4 █████ 2              │  │
│  ┌────────────────────────────────────┐  │ 3 ██ 1                 │  │
│  │ (avatar) João Souza · há 5 dias    │  │ 2 ██ 1                 │  │
│  │ ★★★★☆  Bom, mas...                │  │ 1 0                    │  │
│  └────────────────────────────────────┘  └────────────────────────┘  │
│  [ Carregar mais ]                                                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Sua avaliação                                                  │  │
│  │ Nota: ☆ ☆ ☆ ☆ ☆                                               │  │
│  │ [ Comentário...                                            ]   │  │
│  │ [ Publicar avaliação ]                                         │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Wireframe — mobile

```text
┌──────────────────────────┐
│ ▮▮▮ Produtos     [avatar]│
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │       imagem         │ │
│ │ [ Ver na loja ↗ ]    │ │
│ │ ▮▮▮ DOSSIÊ           │ │
│ │ Fone Aurora          │ │
│ │ descrição            │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ NOTA GERAL           │ │
│ │ 4,6 ★★★★★  12        │ │
│ │ 5 ████████████       │ │
│ └──────────────────────┘ │
│ Avaliações               │
│ ┌──────────────────────┐ │
│ │ Maria · ★★★★★        │ │
│ │ Excelente...         │ │
│ └──────────────────────┘ │
│ [ Carregar mais ]        │
│ ┌──────────────────────┐ │
│ │ Entre para avaliar   │ │
│ │ [ Entrar ]           │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### Componentes

- `src/app/products/[id]/page.tsx`: server component; busca produto via
  `products.byId`/REST; `notFound()` se não existir; metadata; busca conta via
  `getCurrentAccount()`.
- `src/components/products/product-detail-hero.tsx`: imagem, nome, descrição,
  link externo.
- `src/components/feedback/rating-summary.tsx`: média, estrelas, contagem e
  distribuição.
- `src/components/feedback/feedback-list.tsx`: client component com
  `useInfiniteQuery`, cards e “Carregar mais”.
- `src/components/feedback/feedback-card.tsx`: avatar, nome, data, estrelas e
  comentário.
- `src/components/feedback/feedback-form.tsx`: client component com
  `react-hook-form` + Zod, estrelas acessíveis, textarea, alerta de erro e
  confirmação de sucesso.
- `src/components/feedback/star-rating.tsx`: exibição e input de 1–5 estrelas.
- `src/components/feedback/auth-required-block.tsx`: bloco para visitantes com
  link para `/auth/sign-in?redirect=/products/[id]`.
- `src/components/feedback/feedback-skeleton.tsx`: skeleton da lista/resumo.
- `src/lib/validations/feedback.ts`: schema Zod e tipos.
- `src/server/api/routers/feedbacks.ts`: `listByProduct` e `create`.
- `src/app/api/v1/products/[id]/feedbacks/route.ts`: GET e POST.

### Formulário

- Estrelas como grupo de rádio acessível (teclado, `aria-label`, foco visível),
  não apenas ícones clicáveis sem semântica.
- Labels de nota: 1 “Ruim”, 2 “Fraco”, 3 “Regular”, 4 “Bom”, 5 “Excelente”.
- Comentário: textarea com contador `0/1000`, mínimo 1.
- Botão “Publicar avaliação”; durante envio, “Publicando...”.
- Erro de validação inline; erro de servidor em `Alert` vermelho.
- Sucesso: mensagem “Avaliação publicada.”, reset do formulário e invalidação
  da lista/resumo.
- Se a sessão expirar durante o envio, mostrar erro e link para entrar
  novamente.
- Após login, o `?redirect=` leva de volta ao produto.

### Estados

- **Carregando produto**: skeleton do hero.
- **Produto inexistente**: `notFound()` (404).
- **Sem avaliações**: “Ainda não há avaliações. Seja a primeira pessoa a
  avaliar.” + formulário/bloco de auth.
- **Erro na lista**: “Não foi possível carregar as avaliações.” + tentar
  novamente.
- **Fim da lista**: “Você chegou ao fim das avaliações.”
- **Visitante**: bloco de autenticação no lugar do formulário.
- **Autenticado**: formulário visível.
- **Acessibilidade**: foco visível, `aria-live` para erros/sucesso, estrelas com
  texto alternativo, contraste adequado.

### Copy

- Resumo: “Nota geral”, “12 avaliações”, “Ainda sem nota”.
- Formulário: “Sua avaliação”, “Como você avalia este produto?”, “Conte o que
  funcionou e o que não funcionou.”, “Publicar avaliação”.
- Visitante: “Entre para avaliar este produto.”, “Sua opinião ajuda quem está
  decidindo.”, “Entrar”.
- Vazio: “Ainda não há avaliações. Seja a primeira pessoa a avaliar.”

## 7. Arquivos

### Criados

- `database/migrations/20261029000200_create_products_feedbacks.sql`
- `src/lib/validations/feedback.ts`
- `src/server/api/routers/feedbacks.ts`
- `src/app/api/v1/products/[id]/feedbacks/route.ts`
- `src/app/products/[id]/page.tsx`
- `src/components/products/product-detail-hero.tsx`
- `src/components/feedback/rating-summary.tsx`
- `src/components/feedback/feedback-list.tsx`
- `src/components/feedback/feedback-card.tsx`
- `src/components/feedback/feedback-form.tsx`
- `src/components/feedback/star-rating.tsx`
- `src/components/feedback/auth-required-block.tsx`
- `src/components/feedback/feedback-skeleton.tsx`

### Somente leitura

- `src/app/layout.tsx` (header do Sign-In)
- `src/components/site-header.tsx`
- `src/server/api/trpc.ts`
- `src/server/api/root.ts`
- `src/lib/auth/**`
- `src/lib/pagination/cursor.ts`
- `src/lib/validations/product.ts`
- `src/server/api/routers/products.ts`
- `src/app/api/v1/products/[id]/route.ts`
- `src/components/ui/*`
- `src/app/globals.css`
- `tailwind.config.ts`
- `next.config.ts`
- `database/schema.sql`
- `package.json`

## 8. Passos de implementação

1. Criar a migration `products_feedbacks` com checks, FKs, índice e RLS.
2. Implementar schema Zod e consumir o helper de cursor compartilhado da
   Fase 0.
3. Implementar `feedbacksRouter`:
   - `listByProduct` público com paginação e resumo;
   - `create` protegido, com `created_by` da sessão e validação de produto.
4. Implementar o adaptador REST GET/POST.
5. Criar a página `/products/[id]` com `notFound()` e metadata.
6. Criar hero, resumo, lista, card, estrelas e skeleton.
7. Criar o formulário e o bloco de autenticação.
8. Integrar `useInfiniteQuery`/`useMutation` e invalidação.
9. Ajustar responsividade, acessibilidade e estados.
10. Rodar `npm run typecheck` e `npm run lint`.
11. Smoke test manual:
    - visitante vê produto, resumo, lista e bloco de auth;
    - link de auth leva a `/auth/sign-in?redirect=/products/[id]`;
    - login volta ao produto;
    - pessoa logada vê o formulário;
    - nota fora de 1–5 e comentário vazio retornam erro;
    - avaliação válida aparece no topo da lista e atualiza o resumo;
    - produto inexistente retorna 404.

## 9. Performance

- Paginação por cursor; `limit` máximo de 30.
- Resumo calculado em uma query agregada; evitar buscar todas as avaliações
  para calcular média.
- `useInfiniteQuery` com `staleTime` curto e invalidação após criação.
- Avatares DiceBear com `next/image` e tamanho fixo; `loading="lazy"` na lista.
- Evitar re-render da lista inteira ao digitar no formulário (form isolado).
- Imagens do produto com `sizes` adequados.

## 10. Dependências e paralelismo

- Consome da Fase 0: `createTRPCContext`, `protectedProcedure`,
  `getCurrentAccount`, router raiz com `feedbacksRouter`, tipos de feedback.
- Consome da Home: `products.byId`/`GET /api/v1/products/[id]` e o tipo
  `Product`.
- Consome do Sign-In: sessão/cookie e `getCurrentAccount` para decidir entre
  formulário e bloco de autenticação.
- Não edita `src/app/page.tsx`, `layout.tsx`, `root.ts`, `trpc.ts` nem arquivos
  da Home/Sign-In.
- A migration de feedbacks depende da migration de produtos; nomes com
  timestamps garantem a ordem.
- Durante a execução paralela, o bloco de auth pode não funcionar até o Sign-In
  terminar; a integração final valida o fluxo completo.

## 11. Critérios de aceitação → evidência

| Critério | Evidência |
| --- | --- |
| Página de detalhes `/products/[id]` | Rota implementada com dados do produto |
| Informações do produto | Hero com imagem, nome, descrição e link externo |
| Lista de avaliações | `FeedbackList` com paginação |
| Formulário para nova avaliação | `FeedbackForm` com nota 1–5 + comentário |
| Visitante não adiciona comentário | Bloco de auth no lugar do formulário |
| Tabela `products_feedbacks` | Migration com FKs e checks |
| Endpoint de criação | `POST /api/v1/products/[id]/feedbacks` protegido |
| Leitura pública | GET sem sessão |

## 12. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Sessão expirada durante o envio | Tratar `UNAUTHORIZED` com mensagem e link de login |
| Média divergente da lista | Calcular resumo no servidor e invalidar após criação |
| Conflito de rota com Home | Home é owner de `api/v1/products/[id]/route.ts`; Feedback só cria a subpasta `feedbacks` |
| Avaliações duplicadas | Não bloquear nesta entrega; documentar como evolução |
| Produto removido | `404` e `notFound()` |
| Comentário muito longo | Zod + check no banco + contador no formulário |
| Migration antes de products | Timestamp posterior e ordem documentada |

## 13. Definition of Done

- Migration e endpoints implementados.
- Página de detalhes completa com resumo, lista, formulário e bloco de auth.
- Typecheck, lint e build passando.
- Nenhum arquivo de outra feature alterado.
- Relatório final entregue ao orquestrador.
