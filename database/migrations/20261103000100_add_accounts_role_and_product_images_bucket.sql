-- Papel da conta: apenas administradores cadastram produtos.
alter table accounts add column if not exists role text not null default 'user';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'accounts_role_check') then
    alter table accounts
      add constraint accounts_role_check check (role in ('user', 'admin'));
  end if;
end;
$$;

-- Bucket público das imagens de produtos. A leitura é pública (URLs exibidas no
-- site); a escrita acontece só no servidor, com a service role. O próprio
-- bucket limita tamanho (5 MB) e tipos aceitos, além da validação da API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
