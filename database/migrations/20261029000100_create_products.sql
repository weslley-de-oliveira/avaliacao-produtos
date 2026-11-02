-- Catálogo de produtos (specs/home.md)
-- A imagem é um campo adicional ao modelo original: a listagem e o POST manual
-- precisam dela, mas a spec não a lista explicitamente.

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

-- Índice que sustenta a paginação por cursor (created_at desc, id desc).
create index if not exists idx_products_created_at_id
  on products (created_at desc, id desc);

-- Função compartilhada de updated_at (recriada para ser idempotente).
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_products_updated_at on products;
create trigger update_products_updated_at
  before update on products
  for each row
  execute function update_updated_at_column();

-- Todo acesso passa pelo servidor com service role; não há policy pública.
alter table products enable row level security;
