import type {
  BodyCard, BodySection, BodyTemplate, ContactPart, FooterColType, FooterColumn,
  FooterConfig, FooterContact, FooterLink, HeaderConfig, NavChild, NavItem,
} from './types'
import { PARTS, PART_BTN_LABEL, tplOf } from './meta'

export const uid = () => globalThis.crypto.randomUUID()

/* ───────── header ───────── */
export function newHeaderConfig(sectionId: string): HeaderConfig {
  return {
    id: uid(), section_id: sectionId, bg_color: '#141414',
    logo_mode: 'text', logo_text: 'GT7 MOTOR', logo_url: null,
    logo_action: 'none', logo_target_section: null, logo_link_url: null,
    login_enabled: true, login_use_logo: false, login_logo_url: null,
    login_text: 'เข้าสู่ระบบ', login_text_color: '#141414', login_btn_color: '#F5A524',
    login_action: 'none', login_target_section: null, login_link_url: null,
  }
}
export function newNavItem(headerId: string, n: number): NavItem {
  return {
    id: uid(), header_id: headerId, sort_order: n, label: `ปุ่ม ${n}`,
    action: 'none', target_section: null, link_url: null, open_new_tab: false,
    text_color: '#FFFFFF', btn_color: '#141414', border_width: 0, border_color: '#F5A524',
    children: [],
  }
}
export function newNavChild(itemId: string, n: number): NavChild {
  return {
    id: uid(), nav_item_id: itemId, sort_order: n, label: `รายการย่อย ${n}`,
    action: 'link', target_section: null, link_url: null, open_new_tab: false,
    text_color: '#FFFFFF', btn_color: '#1F1F1F', border_width: 0, border_color: '#F5A524',
  }
}
export function sampleHeader(sectionId: string) {
  const config = newHeaderConfig(sectionId)
  const a = newNavItem(config.id, 1)
  a.label = 'หน้าแรก'; a.action = 'section'; a.target_section = 'home'
  const b = newNavItem(config.id, 2)
  b.label = 'บริการ'; b.action = 'section'; b.target_section = 'services'
  const c = newNavItem(config.id, 3)
  c.label = 'ติดต่อเรา'; c.action = 'section'; c.target_section = 'contact'
  c.btn_color = '#F5A524'; c.text_color = '#141414'
  return { config, items: [a, b, c] }
}

/* ───────── body ───────── */
const BODY_TEXT: Record<string, [string, string]> = {
  hero: ['GT7 MOTOR ระบบ POS และ ERP', 'จัดการร้านทั้งหมดในที่เดียว'],
  textimg: ['ทำไมต้อง GT7', 'อธิบายจุดเด่นของระบบสั้นๆ ตรงนี้'],
  cards: ['บริการของเรา', ''],
  gallery: ['ผลงานของเรา', ''],
  cta: ['พร้อมเริ่มใช้งานแล้วหรือยัง', 'ติดต่อเราวันนี้'],
  text: ['เกี่ยวกับเรา', 'เล่าเรื่องราวของร้านหรือบริษัทตรงนี้'],
}
export function uniqueAnchor(existing: string[], base: string) {
  let n = 1
  let name = base
  while (existing.includes(name)) name = `${base}-${++n}`
  return name
}
export function newCard(sectionId: string, n: number): BodyCard {
  return {
    id: uid(), body_section_id: sectionId, sort_order: n,
    title: `บริการ ${n}`, description: 'รายละเอียดสั้นๆ', link_url: null,
    bg_color: '#FFFFFF', border_color: '#D3D1C7', title_color: '#141414', desc_color: '#5F5E5A',
  }
}
export function newBodySection(
  bodyId: string, template: BodyTemplate, n: number, existingAnchors: string[],
): BodySection {
  const type = tplOf(template).type
  const [title, body] = BODY_TEXT[type]
  const dark = type === 'hero'
  const id = uid()
  return {
    id, section_id: bodyId, sort_order: n, template,
    anchor_name: uniqueAnchor(existingAnchors, type === 'textimg' ? 'about' : type),
    bg_color: dark ? '#141414' : '#FFFFFF',
    text_align: template === 'hero-l' || type === 'textimg' ? 'left' : 'center',
    show_title: true, title, title_color: dark ? '#FFFFFF' : '#141414', title_size: 'm', title_url: null,
    show_body: true, body_text: body, body_color: dark ? '#D3D1C7' : '#444441', body_url: null,
    image_url: null, image_link_url: null,
    btn_enabled: type === 'hero' || type === 'cta',
    btn_label: 'เริ่มใช้งาน', btn_bg_color: '#F5A524', btn_text_color: '#141414', btn_radius: 6, btn_url: null,
    cards: type === 'cards' ? [newCard(id, 1), newCard(id, 2), newCard(id, 3)] : [],
    gallery: [],
  }
}
export function sampleBody(bodyId: string): BodySection[] {
  const list: BodySection[] = []
  const add = (t: BodyTemplate, anchor: string) => {
    const s = newBodySection(bodyId, t, list.length + 1, list.map((x) => x.anchor_name))
    s.anchor_name = anchor
    list.push(s)
    return s
  }
  add('hero-c', 'home')
  const about = add('ti-l', 'about'); about.bg_color = '#F4F2EC'
  add('cards', 'services')
  const cta = add('cta', 'contact')
  cta.bg_color = '#F5A524'; cta.title_color = '#141414'; cta.body_color = '#141414'
  cta.btn_bg_color = '#141414'; cta.btn_text_color = '#FFFFFF'
  return list
}

/* ───────── footer ───────── */
export function newFooterConfig(sectionId: string): FooterConfig {
  return { id: uid(), section_id: sectionId, bg_color: '#0E0E0E', bg_image_url: null, overlay_opacity: 55 }
}
export function newContact(columnId: string, part: ContactPart): FooterContact {
  return {
    id: uid(), column_id: columnId, part, text_value: '', btn_enabled: false,
    btn_label: PART_BTN_LABEL[part], btn_bg_color: '#F5A524', btn_text_color: '#141414', btn_url: null,
  }
}
export function newLink(columnId: string, n: number, color = '#FFFFFF'): FooterLink {
  return { id: uid(), column_id: columnId, sort_order: n, label: 'ลิงก์ใหม่', link_url: null, text_color: color }
}
export function newFooterColumn(footerId: string, position: number, type: FooterColType): FooterColumn {
  const id = uid()
  return {
    id, footer_id: footerId, position, col_type: type,
    title: type === 'logo' ? null : 'หัวข้อใหม่', text_color: '#FFFFFF',
    logo_url: null, logo_text: type === 'logo' ? 'GT7 MOTOR' : null, logo_text_color: '#FFFFFF',
    logo_link_url: null, line_qr_url: null,
    links: type === 'links' ? [newLink(id, 1), newLink(id, 2)] : [],
    contacts: PARTS[type].map((part) => newContact(id, part)),
  }
}
export function sampleFooter(sectionId: string) {
  const config = newFooterConfig(sectionId)
  const c1 = newFooterColumn(config.id, 1, 'logo')
  const c2 = newFooterColumn(config.id, 2, 'links'); c2.title = 'ลิงก์ด่วน'
  c2.links[0].label = 'หน้าแรก'; c2.links[0].link_url = '#home'
  c2.links[1].label = 'บริการ'; c2.links[1].link_url = '#services'
  const c3 = newFooterColumn(config.id, 3, 'mapphone'); c3.title = 'ติดต่อเรา'
  const map = c3.contacts.find((x) => x.part === 'map')
  const tel = c3.contacts.find((x) => x.part === 'phone')
  if (map) { map.text_value = '123 ถนนสุขุมวิท กรุงเทพฯ 10110'; map.btn_enabled = true }
  if (tel) { tel.text_value = '02-123-4567'; tel.btn_enabled = true; tel.btn_url = 'tel:021234567' }
  return { config, columns: [c1, c2, c3] }
}
