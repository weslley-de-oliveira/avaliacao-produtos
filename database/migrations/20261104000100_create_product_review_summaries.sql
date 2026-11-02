-- Resumo das avaliações gerado por IA (agente do Mastra), um por produto.
-- Funciona como cache: só é gerado de novo quando o número de avaliações muda,
-- para não chamar o modelo a cada visita à página.

create table if not exists product_review_summaries (
  product_id text primary key references products(id) on delete cascade,
  summary text not null,
  feedback_count integer not null check (feedback_count >= 0),
  model text not null,
  generated_at timestamptz not null default now()
);

-- Todo acesso passa pelo servidor com service role; não há policy pública
alter table product_review_summaries enable row level security;
