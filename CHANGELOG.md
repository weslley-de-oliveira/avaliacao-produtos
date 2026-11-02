# Changelog

## 2026-11-04 — Resumo das avaliações por IA

### Adicionado

- Agente do Mastra (`review-summary-agent`) que lê todas as avaliações do
  produto e escreve um resumo geral em português, exibido em destaque com o
  selo “✦ IA” abaixo da nota geral.
- Cache do resumo na tabela `product_review_summaries` (migration
  `20261104000100_create_product_review_summaries.sql`): o resumo só é gerado
  de novo quando o total de avaliações muda.
- Procedimento tRPC `feedbacks.summary` e porta `ReviewSummarizer`, com o
  Mastra como adaptador carregado sob demanda.
- Suporte a Google Gemini e Groq, além de OpenAI e Anthropic, escolhidos por
  `AI_SUMMARY_MODEL`. O padrão é `google/gemini-3.1-flash-lite` (plano gratuito).

### Alterado

- Página do produto: nota geral e resumo por IA à esquerda, formulário de
  avaliação à direita e lista de avaliações em largura total abaixo.
- A lista e a nota geral compartilham a mesma consulta (`useProductFeedbacks`).

### Segurança e robustez

- Comentários enviados ao modelo como JSON delimitado, com `<` e `>` escapados,
  e o agente instruído a ignorar instruções escritas neles (injeção de prompt).
- Falha ou ausência da IA não quebra a página: mostra o último resumo salvo ou
  “indisponível”, e o produto fica 5 minutos sem nova tentativa.

### Corrigido

- `tailwind.config.ts` usava `require()`, que falha no Node 24 (o arquivo é
  carregado como ES Module); trocado por `import`.

## 2026-11-03 — Cadastro de produtos

### Adicionado

- Página `/products/new` para administradores, com upload da imagem para o
  Supabase Storage (bucket `product-images`) e validação do tipo pelo conteúdo
  do arquivo.
- Papel `role` em `accounts` (`user` | `admin`) e `adminProcedure` no tRPC.
- Lista única de domínios de imagem, usada pelo `next.config.ts` e pela
  validação do `imageUrl`.

## 2026-11-02 — Primeira versão

- Catálogo com scroll infinito, página do produto, cadastro, login e
  avaliações de 1 a 5.
- API REST `/api/v1` sobre os mesmos procedimentos do tRPC.
- Back-end em camadas (routers, serviços e repositórios) com testes em Vitest.
- Workflow do n8n para importar produtos com filtro de duplicados.
- Tema branco com detalhes em vermelho e preto.
