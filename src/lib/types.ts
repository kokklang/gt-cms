export type ClickAction = 'none' | 'section' | 'link' | 'dropdown'
export type LinkAction = Exclude<ClickAction, 'dropdown'>
export type SectionKind = 'header' | 'body' | 'footer'

/* ───────── header ───────── */
export interface HeaderConfig {
  id: string
  section_id: string
  bg_color: string
  logo_mode: 'text' | 'logo'
  logo_text: string | null
  logo_url: string | null
  logo_action: LinkAction
  logo_target_section: string | null
  logo_link_url: string | null
  login_enabled: boolean
  login_use_logo: boolean
  login_logo_url: string | null
  login_text: string | null
  login_text_color: string
  login_btn_color: string
  login_action: LinkAction
  login_target_section: string | null
  login_link_url: string | null
}

export interface NavChild {
  id: string
  nav_item_id: string
  sort_order: number
  label: string
  action: LinkAction
  target_section: string | null
  link_url: string | null
  open_new_tab: boolean
  text_color: string
  btn_color: string
  border_width: number
  border_color: string
}

export interface NavItemRow {
  id: string
  header_id: string
  sort_order: number
  label: string
  action: ClickAction
  target_section: string | null
  link_url: string | null
  open_new_tab: boolean
  text_color: string
  btn_color: string
  border_width: number
  border_color: string
}
export type NavItem = NavItemRow & { children: NavChild[] }
export interface HeaderData {
  config: HeaderConfig
  items: NavItem[]
}

/* ───────── body ───────── */
export type BodyTemplate =
  | 'hero-c' | 'hero-l' | 'ti-l' | 'ti-r' | 'cards' | 'gal3' | 'gal2' | 'cta' | 'txt'

export interface BodySectionRow {
  id: string
  section_id: string
  sort_order: number
  template: BodyTemplate
  anchor_name: string
  bg_color: string
  text_align: 'left' | 'center' | 'right'
  show_title: boolean
  title: string | null
  title_color: string
  title_size: 's' | 'm' | 'l'
  title_url: string | null
  show_body: boolean
  body_text: string | null
  body_color: string
  body_url: string | null
  image_url: string | null
  image_link_url: string | null
  btn_enabled: boolean
  btn_label: string | null
  btn_bg_color: string
  btn_text_color: string
  btn_radius: number
  btn_url: string | null
}
export interface BodyCard {
  id: string
  body_section_id: string
  sort_order: number
  title: string | null
  description: string | null
  link_url: string | null
  bg_color: string
  border_color: string
  title_color: string
  desc_color: string
}
export interface BodyImage {
  id: string
  body_section_id: string
  sort_order: number
  image_url: string
  link_url: string | null
}
export type BodySection = BodySectionRow & { cards: BodyCard[]; gallery: BodyImage[] }

/* ───────── footer ───────── */
export type FooterColType = 'logo' | 'links' | 'mapphone' | 'phone' | 'map' | 'email' | 'line'
export type ContactPart = 'map' | 'phone' | 'email' | 'line'

export interface FooterConfig {
  id: string
  section_id: string
  bg_color: string
  bg_image_url: string | null
  overlay_opacity: number
}
export interface FooterColumnRow {
  id: string
  footer_id: string
  position: number
  col_type: FooterColType
  title: string | null
  text_color: string
  logo_url: string | null
  logo_text: string | null
  logo_text_color: string
  logo_link_url: string | null
  line_qr_url: string | null
}
export interface FooterLink {
  id: string
  column_id: string
  sort_order: number
  label: string
  link_url: string | null
  text_color: string
}
export interface FooterContact {
  id: string
  column_id: string
  part: ContactPart
  text_value: string | null
  btn_enabled: boolean
  btn_label: string | null
  btn_bg_color: string
  btn_text_color: string
  btn_url: string | null
}
export type FooterColumn = FooterColumnRow & { links: FooterLink[]; contacts: FooterContact[] }
export interface FooterData {
  config: FooterConfig
  columns: FooterColumn[]
}

/* ───────── รวม ───────── */
export interface SiteContent {
  sectionIds: Record<SectionKind, string>
  header: HeaderData | null
  body: BodySection[]
  footer: FooterData | null
}

/* payload ที่ส่งเข้า RPC (ชื่อคีย์ = ชื่อคอลัมน์ในตาราง) */
export interface HeaderPayload {
  config: HeaderConfig
  items: NavItemRow[]
  children: NavChild[]
}
export interface BodyPayload {
  section_id: string
  sections: BodySectionRow[]
  cards: BodyCard[]
  images: BodyImage[]
}
export interface FooterPayload {
  config: FooterConfig
  columns: FooterColumnRow[]
  links: FooterLink[]
  contacts: FooterContact[]
}
export interface ActionResult {
  ok: boolean
  error?: string
}
