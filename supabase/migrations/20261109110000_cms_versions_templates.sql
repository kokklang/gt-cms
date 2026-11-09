create table if not exists cms_library_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('version', 'draft', 'template')),
  scope text not null check (scope in ('page', 'header', 'body', 'footer', 'section')),
  label text not null,
  content jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists cms_library_items_kind_created_idx
  on cms_library_items (kind, created_at desc);

alter table cms_library_items enable row level security;

create policy "admin read cms library" on cms_library_items
  for select using (is_admin());
create policy "admin insert cms library" on cms_library_items
  for insert with check (is_admin());
create policy "admin delete cms library" on cms_library_items
  for delete using (is_admin());

create or replace function apply_site_snapshot(p jsonb) returns void
language plpgsql as $$
declare
  ids jsonb := p->'sectionIds';
begin
  if not is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน'; end if;

  if p->'header' is null or p->'header' = 'null'::jsonb then
    delete from header_config where section_id = (ids->>'header')::uuid;
  else
    perform save_header(p->'header');
  end if;

  perform save_body(p->'body');

  if p->'footer' is null or p->'footer' = 'null'::jsonb then
    delete from footer_config where section_id = (ids->>'footer')::uuid;
  else
    perform save_footer(p->'footer');
  end if;
end $$;
