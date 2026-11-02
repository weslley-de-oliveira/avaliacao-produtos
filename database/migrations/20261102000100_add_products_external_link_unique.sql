-- Um produto por link externo: impede que importações automáticas (n8n) ou
-- inserções manuais cadastrem o mesmo produto duas vezes.
-- Falha se já houver links repetidos; remova-os antes de aplicar.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_external_link_key'
  ) then
    alter table products
      add constraint products_external_link_key unique (external_link);
  end if;
end;
$$;
