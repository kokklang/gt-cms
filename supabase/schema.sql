-- GT7 MOTOR Landing CMS — schema รวม (Supabase / Postgres)
-- รันทั้งไฟล์ใน Supabase → SQL Editor (รันครั้งเดียวบนฐานข้อมูลใหม่)

create type click_action as enum ('none', 'section', 'link', 'dropdown');
create type footer_col_type as enum
  ('logo','links','mapphone','phone','map','email','line');
create type contact_part as enum ('map','phone','email','line');
create type body_template as enum
  ('hero-c','hero-l','ti-l','ti-r','cards','gal3','gal2','cta','txt','video');

create table site_sections (
  id uuid primary key default gen_random_uuid(),
  kind text not null unique check (kind in ('header','body','footer')),
  updated_at timestamptz default now()
);

insert into site_sections (kind) values ('header'),('body'),('footer')
on conflict (kind) do nothing;

create table header_config (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null unique references site_sections(id) on delete cascade,

  bg_color text default '#141414',
  bg_image_url text,

  -- โซน 1: hero / โลโก้
  logo_mode text not null default 'text' check (logo_mode in ('text','logo')),
  logo_text text,
  logo_url text,
  logo_width smallint default 100,
  logo_action click_action not null default 'none'
    check (logo_action in ('none','section','link')),
  logo_target_section text,                 -- anchor_name ของ body_sections
  logo_link_url text,
  logo_open_new_tab boolean default false,

  -- โซน 3: ช่องล็อกอิน
  login_enabled boolean default true,
  login_use_logo boolean default false,
  login_logo_url text,
  login_text text default 'เข้าสู่ระบบ',
  login_text_color text default '#141414',
  login_btn_color text default '#F5A524',
  login_border_width smallint default 0,
  login_border_color text default '#F5A524',
  login_action click_action not null default 'link'
    check (login_action in ('none','section','link')),
  login_target_section text,
  login_link_url text,
  login_open_new_tab boolean default false
);

-- โซน 2: ปุ่มนำทาง (สูงสุด 8)
create table header_nav_items (
  id uuid primary key default gen_random_uuid(),
  header_id uuid not null references header_config(id) on delete cascade,
  sort_order smallint not null check (sort_order between 1 and 8),
  label text not null,
  action click_action not null default 'none',
  target_section text,
  link_url text,
  open_new_tab boolean default false,
  text_color text default '#FFFFFF',
  btn_color text default '#141414',
  border_width smallint default 0,
  border_color text default '#F5A524',
  unique (header_id, sort_order)
);

-- รายการย่อยของเมนูดรอปดาวน์ (แก้ได้เหมือนปุ่มปกติ ยกเว้นซ้อนดรอปดาวน์)
create table header_nav_children (
  id uuid primary key default gen_random_uuid(),
  nav_item_id uuid not null references header_nav_items(id) on delete cascade,
  sort_order smallint not null,
  label text not null,
  action click_action not null default 'link'
    check (action in ('none','section','link')),
  target_section text,
  link_url text,
  open_new_tab boolean default false,
  text_color text default '#FFFFFF',
  btn_color text default '#1F1F1F',
  border_width smallint default 0,
  border_color text default '#F5A524'
);

-- กันเกิน 8 ปุ่ม
create or replace function enforce_max_nav() returns trigger as $$
begin
  if (select count(*) from header_nav_items where header_id = new.header_id) >= 8 then
    raise exception 'header มีปุ่มนำทางได้สูงสุด 8 ปุ่ม';
  end if;
  return new;
end $$ language plpgsql;

create trigger trg_max_nav before insert on header_nav_items
for each row execute function enforce_max_nav();

create table body_sections (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references site_sections(id) on delete cascade, -- แถว kind = 'body'
  sort_order int not null,
  template body_template not null,
  anchor_name text not null check (anchor_name ~ '^[a-zA-Z0-9-]+$'),

  bg_color text default '#FFFFFF',
  text_align text default 'center' check (text_align in ('left','center','right')),

  -- หัวข้อ
  show_title boolean default true,
  title text,
  title_color text default '#141414',
  title_size text default 'm' check (title_size in ('s','m','l')),
  title_url text,
  title_target_section text,
  title_open_new_tab boolean default false,

  -- ข้อความ
  show_body boolean default true,
  body_text text,
  body_color text default '#444441',
  body_url text,
  body_target_section text,
  body_open_new_tab boolean default false,

  -- รูป: hero = รูปพื้นหลัง / ti-l, ti-r = รูปภาพ
  image_url text,
  image_width smallint default 100,
  image_link_url text,
  image_target_section text,
  image_open_new_tab boolean default false,
  video_url text,
  video_link_url text,
  video_target_section text,
  video_open_new_tab boolean default false,

  -- ปุ่ม
  btn_enabled boolean default false,
  btn_label text,
  btn_bg_color text default '#F5A524',
  btn_text_color text default '#141414',
  btn_border_width smallint default 0,
  btn_border_color text default '#F5A524',
  btn_radius smallint default 6,
  btn_url text,
  btn_target_section text,
  btn_open_new_tab boolean default false,

  unique (section_id, sort_order) deferrable initially deferred,
  unique (section_id, anchor_name)
);

-- การ์ดของ template cards (สูงสุด 6)
create table body_cards (
  id uuid primary key default gen_random_uuid(),
  body_section_id uuid not null references body_sections(id) on delete cascade,
  sort_order smallint not null check (sort_order between 1 and 6),
  title text,
  description text,
  link_url text,
  target_section text,
  open_new_tab boolean default false,
  bg_color text default '#FFFFFF',
  border_color text default '#D3D1C7',
  title_color text default '#141414',
  desc_color text default '#5F5E5A',
  unique (body_section_id, sort_order)
);

-- รูปของ template gallery (สูงสุด 6)
create table body_gallery_images (
  id uuid primary key default gen_random_uuid(),
  body_section_id uuid not null references body_sections(id) on delete cascade,
  sort_order smallint not null check (sort_order between 1 and 6),
  image_url text not null,
  link_url text,
  target_section text,
  open_new_tab boolean default false,
  image_width smallint default 100,
  unique (body_section_id, sort_order)
);

create table footer_config (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null unique references site_sections(id) on delete cascade,
  bg_color text default '#0E0E0E',
  bg_image_url text,
  overlay_opacity smallint default 55 check (overlay_opacity between 0 and 90)
);

-- คอลัมน์ 1–4
create table footer_columns (
  id uuid primary key default gen_random_uuid(),
  footer_id uuid not null references footer_config(id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  col_type footer_col_type not null,
  title text,
  text_color text default '#FFFFFF',      -- สีหัวข้อคอลัมน์
  -- ชนิด logo
  logo_url text,
  logo_text text,
  logo_text_color text default '#FFFFFF',
  logo_link_url text,
  logo_target_section text,
  logo_open_new_tab boolean default false,
  logo_width smallint default 100,
  -- ชนิด line
  line_qr_url text,
  unique (footer_id, position)
);

-- ชนิด links
create table footer_links (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references footer_columns(id) on delete cascade,
  sort_order smallint not null,
  label text not null,
  link_url text,
  target_section text,
  open_new_tab boolean default false,
  text_color text default '#FFFFFF'
);

-- ชนิด map / phone / mapphone / email / line: ข้อความ + ปุ่ม ต่อส่วนย่อย
create table footer_contacts (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references footer_columns(id) on delete cascade,
  part contact_part not null,
  text_value text,                        -- ที่อยู่ / เบอร์ / อีเมล / LINE ID
  btn_enabled boolean default false,
  btn_label text,
  btn_bg_color text default '#F5A524',
  btn_text_color text default '#141414',
  btn_border_width smallint default 0,
  btn_border_color text default '#F5A524',
  btn_url text,                           -- https://maps..., tel:..., mailto:..., https://line.me/...
  btn_target_section text,
  btn_open_new_tab boolean default false,
  unique (column_id, part)
);

create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'site_sections',
    'header_config','header_nav_items','header_nav_children',
    'body_sections','body_cards','body_gallery_images',
    'footer_config','footer_columns','footer_links','footer_contacts'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "admin write" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- ตั้งสิทธิ์แอดมิน: แก้อีเมลแล้วรันแยกหลังสร้างผู้ใช้ใน Authentication → Users
-- update auth.users
-- set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
-- where email = 'ใส่อีเมลแอดมิน';

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

create policy "admin manage site-assets" on storage.objects
for all
using (bucket_id = 'site-assets' and is_admin())
with check (bucket_id = 'site-assets' and is_admin());


-- ═══════════════════════════════════════════════════════════
-- ฟังก์ชันบันทึกแบบ atomic (ทำใน transaction เดียว)
-- หน้า admin ส่งข้อมูลทั้งส่วนเป็น jsonb: ลบของเดิมแล้วใส่ใหม่
-- คีย์ใน jsonb ต้องตรงกับชื่อคอลัมน์ (ฝั่ง Next.js ส่งครบทุกคอลัมน์)
-- ทำงานด้วยสิทธิ์ผู้เรียก (security invoker) จึงถูก RLS + is_admin() ตรวจซ้ำ
-- ═══════════════════════════════════════════════════════════
create or replace function save_header(p jsonb) returns void
language plpgsql as $$
declare sid uuid := (p->'config'->>'section_id')::uuid;
begin
  if not is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน'; end if;
  delete from header_config where section_id = sid;
  insert into header_config select * from jsonb_populate_record(null::header_config, p->'config');
  insert into header_nav_items select * from jsonb_populate_recordset(null::header_nav_items, p->'items');
  insert into header_nav_children select * from jsonb_populate_recordset(null::header_nav_children, p->'children');
  update site_sections set updated_at = now() where id = sid;
end $$;

create or replace function save_body(p jsonb) returns void
language plpgsql as $$
declare sid uuid := (p->>'section_id')::uuid;
begin
  if not is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน'; end if;
  delete from body_sections where section_id = sid;
  insert into body_sections select * from jsonb_populate_recordset(null::body_sections, p->'sections');
  insert into body_cards select * from jsonb_populate_recordset(null::body_cards, p->'cards');
  insert into body_gallery_images select * from jsonb_populate_recordset(null::body_gallery_images, p->'images');
  update site_sections set updated_at = now() where id = sid;
end $$;

create or replace function save_footer(p jsonb) returns void
language plpgsql as $$
declare sid uuid := (p->'config'->>'section_id')::uuid;
begin
  if not is_admin() then raise exception 'ไม่มีสิทธิ์แอดมิน'; end if;
  delete from footer_config where section_id = sid;
  insert into footer_config select * from jsonb_populate_record(null::footer_config, p->'config');
  insert into footer_columns select * from jsonb_populate_recordset(null::footer_columns, p->'columns');
  insert into footer_links select * from jsonb_populate_recordset(null::footer_links, p->'links');
  insert into footer_contacts select * from jsonb_populate_recordset(null::footer_contacts, p->'contacts');
  update site_sections set updated_at = now() where id = sid;
end $$;
