# Avaliação de Produtos

Módulo de engajamento para um catálogo de produtos: qualquer pessoa navega
pelos produtos, e quem tem conta deixa uma nota de 1 a 5 com comentário. A nota
geral e a distribuição das avaliações aparecem na página de cada produto. Um
workflow do n8n importa produtos de uma loja externa automaticamente.

## Funcionalidades

- **Catálogo** com scroll infinito (paginação por cursor) e cards com imagem e
  nome.
- **Página do produto** com imagem, descrição e link para a loja; abaixo, a nota
  geral (com a distribuição por nota) e o resumo por IA à esquerda, o formulário
  de avaliação à direita e a lista paginada de avaliações em largura total.
- **Cadastro e login** com sessão própria em cookie httpOnly assinado (HMAC).
- **Avaliações** de 1 a 5 com comentário, disponíveis apenas para quem está
  logado.
- **Resumo das avaliações por IA**: um agente do Mastra lê todos os comentários
  do produto e escreve um resumo geral, exibido em destaque (selo “IA”) abaixo
  do gráfico de notas. O resumo fica em cache e só é refeito quando chegam
  avaliações novas.
- **Cadastro de produtos** para administradores, com upload da imagem para o
  Supabase Storage (tipo validado pelo conteúdo do arquivo, até 5 MB).
- **API REST** (`/api/v1/*`) para integrações, ao lado da API tRPC usada pela
  interface.
- **Importação automática** de produtos via n8n: scraping de uma loja, filtro de
  duplicados e cadastro pela API autenticada.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Front-end | [Next.js 15](https://nextjs.org) (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), lucide-react |
| Formulários e dados | React Hook Form, Zod, TanStack React Query, cliente tRPC, date-fns |
| Back-end | Route Handlers do Next.js, [tRPC 11](https://trpc.io), Zod, superjson, bcryptjs, nanoid |
| Banco de dados | [Supabase](https://supabase.com) (PostgreSQL) com RLS e Supabase Storage |
| Automação | [n8n](https://n8n.io) em Docker (Docker Compose) |
| IA | [Mastra](https://mastra.ai): agente que resume as avaliações de cada produto (Google Gemini 3.1 Flash-Lite por padrão, com plano gratuito) e agente interno de suporte (scaffold) |
| Qualidade | Vitest, Biome (lint e formatação), TypeScript estrito |
| Deploy | Pensado para a Vercel |

## Arquitetura

O back-end é organizado em camadas, com injeção de dependência:

```text
REST /api/v1/*  ─┐
                 ├─▶ Routers tRPC ─▶ Serviços ─▶ Repositórios ─▶ Supabase
UI (React Query)─┘   validação Zod   regras de   acesso a dados
                     + sessão        negócio
```

- As **rotas REST** só traduzem HTTP: chamam o mesmo procedimento tRPC da
  interface, então a regra de negócio existe em um lugar só.
- Os **serviços** concentram as regras e não conhecem tRPC, HTTP nem Supabase.
  Eles dependem de **interfaces de repositório**, o que permite testá-los com
  repositórios em memória.
- Os **erros** seguem um caminho único: erro de domínio → tRPC → HTTP. Erros
  inesperados nunca expõem detalhes do banco.

Os detalhes e as decisões estão em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Os planos de cada feature e as especificações originais estão em
[`docs/plans`](docs/plans) e [`specs`](specs).

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org) 20 ou superior, com npm
- Uma conta gratuita no [Supabase](https://supabase.com)
- [Docker](https://www.docker.com) (opcional, apenas para o n8n)

### 1. Instale as dependências

```bash
git clone <url-do-repositorio>
cd modulo-engajamento-sistema-avaliacao-produtos
npm install
```

### 2. Crie o banco no Supabase

1. Crie um projeto no [painel do Supabase](https://supabase.com/dashboard).
2. Abra o **SQL Editor** e execute o conteúdo de
   [`database/schema.sql`](database/schema.sql). Ele cria as tabelas
   `accounts`, `products`, `products_feedbacks` e `product_review_summaries`
   (cache do resumo por IA), com índices, triggers e RLS, e o bucket público
   `product-images` do Storage.
3. No mesmo editor, execute [`database/seed.sql`](database/seed.sql) para
   carregar 10 produtos de exemplo.

Os dois scripts podem ser executados mais de uma vez sem duplicar dados. As
migrações separadas por feature estão em
[`database/migrations`](database/migrations).

### 3. Configure as variáveis de ambiente

Copie o modelo para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha os valores:

| Variável | Obrigatória | Onde obter |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Supabase → **Project Settings → API** → *Project URL* |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Supabase → **Project Settings → API** → *service_role*. Usada só no servidor; nunca a exponha no navegador. |
| `AUTH_SESSION_SECRET` | Sim | Gere com o comando abaixo |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Não | Ativa o resumo das avaliações por IA com o Gemini (gratuito, gere em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)). Sem ela, o site funciona normalmente e o resumo aparece como indisponível. |
| `AI_SUMMARY_MODEL` | Não | Troca o modelo do resumo (formato `provedor/modelo`; padrão `google/gemini-3.1-flash-lite`). Também aceita `groq/...` (`GROQ_API_KEY`), `openai/...` (`OPENAI_API_KEY`) e `anthropic/...` (`ANTHROPIC_API_KEY`). |
| `OPENAI_API_KEY` | Não | Só para o agente de suporte (scaffold) ou se o resumo usar um modelo `openai/...` |
| `N8N_ENCRYPTION_KEY` | Não | Só para o n8n (vai no arquivo `.env`, lido pelo Docker Compose) |

`NEXT_PUBLIC_SUPABASE_ANON_KEY` aparece no modelo, mas não é usada: todo acesso
ao banco passa pelo servidor.

Para gerar o `AUTH_SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 4. Suba a aplicação

```bash
npm run dev
```

Abra <http://localhost:3000>: a home mostra os 10 produtos do seed. Para
avaliar um produto, crie uma conta em **Criar conta**
(<http://localhost:3000/auth/sign-up>), entre e abra a página do produto.

Para cadastrar produtos, a conta precisa ser administradora. Depois de criá-la,
execute no SQL Editor do Supabase:

```sql
update accounts set role = 'admin' where email = 'seu@email.com';
```

Entre de novo: o link **Novo produto** aparece no cabeçalho
(<http://localhost:3000/products/new>).

### 5. (Opcional) Importe produtos com o n8n

O workflow faz login na API, lê a coleção de uma loja, monta nome, link, imagem
e descrição de cada produto, descarta os que já existem e cadastra o restante.

1. Defina `N8N_ENCRYPTION_KEY` num arquivo `.env` na raiz (qualquer valor
   aleatório) e suba o n8n:

   ```bash
   docker compose up -d n8n
   ```

2. Com a aplicação rodando (`npm run dev`), abra <http://localhost:5678> e crie
   a conta de administrador do n8n.
3. Importe [`n8n/import-products.workflow.json`](n8n/import-products.workflow.json)
   (menu do workflow → **Import from File**).
4. No nó **Login**, troque `SEU_EMAIL@exemplo.com` e `SUA_SENHA` pelas
   credenciais de uma conta **administradora** (passo 4). Esses dados ficam
   salvos no workflow; prefira uma conta usada só para a integração.
5. Clique em **Execute workflow**. Os produtos aparecem na home; uma nova
   execução não cria duplicados.

O n8n acessa a aplicação em `host.docker.internal:3000`, então ela precisa estar
rodando na porta 3000 da sua máquina. A loja usada no workflow
(brazil.nothingprojector.com) serve apenas para demonstrar a integração.

> O arquivo do workflow foi exportado do n8n com as credenciais substituídas por
> marcadores. A importação a partir desse arquivo não foi testada de ponta a
> ponta.

## API REST

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/v1/sign-up` | — | Cria uma conta (`201`; `409` se o email existe) |
| `POST` | `/api/v1/sign-in` | — | Inicia a sessão (cookie `av_session`) |
| `POST` | `/api/v1/sign-out` | — | Encerra a sessão (`204`) |
| `GET` | `/api/v1/products?limit=&cursor=` | — | Lista produtos (array; próxima página no header `X-Next-Cursor`) |
| `POST` | `/api/v1/products` | Admin | Cadastra um produto (`403` sem papel de admin; `409` se o `externalLink` já existe) |
| `POST` | `/api/v1/product-images` | Admin | Envia a imagem (multipart, campo `file`; JPG, PNG ou WebP até 5 MB) e devolve a URL pública |
| `GET` | `/api/v1/products/:id` | — | Detalhe do produto |
| `GET` | `/api/v1/products/:id/feedbacks?limit=&cursor=` | — | Avaliações paginadas e resumo das notas |
| `POST` | `/api/v1/products/:id/feedbacks` | Sessão | Cria uma avaliação |

Erros seguem o formato `{ "error": "mensagem" }`. Erros de validação trazem
também `details` com as mensagens por campo. O `imageUrl` de um produto só
aceita domínios liberados para o `next/image` (Unsplash, a loja do n8n e o
bucket do Storage), para que nenhuma imagem quebre as páginas.

## Testes e qualidade

```bash
npm run test        # Vitest
npm run lint        # Biome
npm run typecheck   # TypeScript
```

Os testes cobrem as regras de negócio dos serviços (com repositórios em
memória), a paginação por cursor, inclusive a proteção contra injeção no
filtro, a assinatura e a expiração da sessão, a tradução de erros para HTTP, o
middleware de erros do tRPC, a autorização de administrador, a lista de domínios
de imagem, a validação do upload pelo conteúdo do arquivo e o resumo por IA
(cache, nova geração, falhas do modelo e proteção contra injeção de prompt nos
comentários).

## Estrutura

```text
src/
├── app/            # páginas (App Router) e rotas REST /api/v1
├── components/     # componentes por feature (auth, products, feedback) e ui/ (shadcn)
├── lib/            # código compartilhado: schemas Zod, cursor, sessão, tipos
├── server/
│   ├── api/        # tRPC: contexto, middlewares, routers
│   ├── services/   # regras de negócio
│   ├── repositories/ # interfaces + implementações Supabase
│   ├── ai/         # porta do resumo por IA e adaptador do Mastra
│   ├── storage/    # armazenamento de imagens (Supabase Storage)
│   ├── http/       # tradução de erros das rotas REST
│   └── container.ts  # composição das dependências
├── trpc/           # cliente tRPC + React Query
└── mastra/         # agentes de IA (resumo das avaliações e suporte)
database/           # schema, migrações e seed
n8n/                # workflow de importação de produtos
docs/               # arquitetura e planos por feature
specs/              # especificações das features
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm run start` | Build e execução em produção |
| `npm run test` / `npm run test:watch` | Testes |
| `npm run lint` / `npm run lint:fix` | Lint com Biome (com ou sem correções) |
| `npm run format` | Formatação com Biome |
| `npm run typecheck` | Checagem de tipos |
