-- Avaliações de produtos (feature Feedback)
-- Depende de: 20261029000100_create_products.sql

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
