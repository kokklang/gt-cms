alter type body_template add value if not exists 'video';

alter table header_config
  add column if not exists bg_image_url text,
  add column if not exists logo_width smallint not null default 100,
  add column if not exists logo_open_new_tab boolean not null default false,
  add column if not exists login_border_width smallint not null default 0,
  add column if not exists login_border_color text not null default '#F5A524',
  add column if not exists login_open_new_tab boolean not null default false;

alter table body_sections
  add column if not exists title_target_section text,
  add column if not exists title_open_new_tab boolean not null default false,
  add column if not exists body_target_section text,
  add column if not exists body_open_new_tab boolean not null default false,
  add column if not exists image_width smallint not null default 100,
  add column if not exists image_target_section text,
  add column if not exists image_open_new_tab boolean not null default false,
  add column if not exists video_url text,
  add column if not exists video_link_url text,
  add column if not exists video_target_section text,
  add column if not exists video_open_new_tab boolean not null default false,
  add column if not exists btn_border_width smallint not null default 0,
  add column if not exists btn_border_color text not null default '#F5A524',
  add column if not exists btn_target_section text,
  add column if not exists btn_open_new_tab boolean not null default false;

alter table body_cards
  add column if not exists target_section text,
  add column if not exists open_new_tab boolean not null default false;

alter table body_gallery_images
  add column if not exists target_section text,
  add column if not exists open_new_tab boolean not null default false,
  add column if not exists image_width smallint not null default 100;

alter table footer_columns
  add column if not exists logo_target_section text,
  add column if not exists logo_open_new_tab boolean not null default false,
  add column if not exists logo_width smallint not null default 100;

alter table footer_links
  add column if not exists target_section text,
  add column if not exists open_new_tab boolean not null default false;

alter table footer_contacts
  add column if not exists btn_border_width smallint not null default 0,
  add column if not exists btn_border_color text not null default '#F5A524',
  add column if not exists btn_target_section text,
  add column if not exists btn_open_new_tab boolean not null default false;
