import type { BodyTemplate, ContactPart, FooterColType } from './types'

export const TEMPLATES: {
  key: BodyTemplate
  type: 'hero' | 'textimg' | 'cards' | 'gallery' | 'cta' | 'text' | 'video'
  name: string
}[] = [
  { key: 'hero-c', type: 'hero', name: 'Hero กึ่งกลาง' },
  { key: 'hero-l', type: 'hero', name: 'Hero ชิดซ้าย' },
  { key: 'ti-l', type: 'textimg', name: 'รูปซ้าย + ข้อความ' },
  { key: 'ti-r', type: 'textimg', name: 'ข้อความ + รูปขวา' },
  { key: 'cards', type: 'cards', name: 'การ์ดบริการ' },
  { key: 'gal3', type: 'gallery', name: 'แกลเลอรี 3 คอลัมน์' },
  { key: 'gal2', type: 'gallery', name: 'แกลเลอรี 2 คอลัมน์' },
  { key: 'cta', type: 'cta', name: 'ปุ่มเรียกร้อง CTA' },
  { key: 'txt', type: 'text', name: 'ข้อความล้วน' },
  { key: 'video', type: 'video', name: 'วิดีโอ + ลิงก์' },
]
export const ADD_TEMPLATES: { key: BodyTemplate; name: string }[] = [
  { key: 'hero-c', name: 'Hero' },
  { key: 'ti-l', name: 'รูปภาพ + ข้อความ' },
  { key: 'cards', name: 'การ์ดบริการ' },
  { key: 'gal3', name: 'แกลเลอรีรูปภาพ' },
  { key: 'cta', name: 'ปุ่มเรียกร้อง CTA' },
  { key: 'txt', name: 'ข้อความล้วน' },
  { key: 'video', name: 'วิดีโอ + ลิงก์' },
]
export const tplOf = (k: BodyTemplate) => TEMPLATES.find((t) => t.key === k)!

export const FOOTER_TYPES: [FooterColType, string][] = [
  ['logo', 'โลโก้ทั้งคอลัมน์'],
  ['links', 'รายการข้อความ + ลิงก์'],
  ['mapphone', 'แผนที่ + เบอร์โทร'],
  ['phone', 'เบอร์โทร'],
  ['map', 'แผนที่'],
  ['email', 'อีเมล'],
  ['line', 'LINE'],
]
export const PARTS: Record<FooterColType, ContactPart[]> = {
  logo: [],
  links: [],
  mapphone: ['map', 'phone'],
  phone: ['phone'],
  map: ['map'],
  email: ['email'],
  line: ['line'],
}
export const PART_LABEL: Record<ContactPart, string> = {
  map: 'แผนที่',
  phone: 'เบอร์โทร',
  email: 'อีเมล',
  line: 'LINE',
}
export const PART_BTN_LABEL: Record<ContactPart, string> = {
  map: 'เปิดแผนที่',
  phone: 'โทรเลย',
  email: 'ส่งอีเมล',
  line: 'เพิ่มเพื่อน LINE',
}
export const PART_URL_HINT: Record<ContactPart, string> = {
  map: 'https://maps.app.goo.gl/...',
  phone: 'tel:0212345678',
  email: 'mailto:hello@example.com',
  line: 'https://line.me/ti/p/...',
}
export const PART_TEXT_HINT: Record<ContactPart, string> = {
  map: 'ที่อยู่',
  phone: 'เบอร์โทร',
  email: 'อีเมล',
  line: 'LINE ID',
}
