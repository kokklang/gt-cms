'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { contentToPayloads, loadContent, toBodyPayload } from '@/lib/content'
import { sampleBody, sampleFooter, sampleHeader } from '@/lib/defaults'
import type {
  ActionResult, BodyPayload, BodySection, FooterPayload, HeaderPayload, LibraryKind,
  LibraryScope, SiteContent,
} from '@/lib/types'

/** ทุก action ต้องเป็นแอดมินเท่านั้น (และฐานข้อมูลตรวจซ้ำอีกชั้นด้วย RLS + is_admin()) */
async function guard() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (user?.app_metadata?.role !== 'admin') throw new Error('ไม่มีสิทธิ์แอดมิน')
  return sb
}

function explain(msg: string) {
  if (/anchor_name/.test(msg) && /duplicate|unique/i.test(msg)) return 'ชื่อ section ซ้ำกัน ต้องไม่ซ้ำในหน้าเดียวกัน'
  if (/สูงสุด 8/.test(msg)) return 'header มีปุ่มนำทางได้สูงสุด 8 ปุ่ม'
  if (/save_(header|body|footer)/.test(msg) && /not find|does not exist/i.test(msg))
    return 'ไม่พบฟังก์ชันบันทึกในฐานข้อมูล: รัน supabase/schema.sql ให้ครบก่อน'
  return msg
}

async function save(fn: 'save_header' | 'save_body' | 'save_footer', p: unknown): Promise<ActionResult> {
  try {
    const sb = await guard()
    const previous = await loadContent(sb)
    const { error } = await sb.rpc(fn, { p })
    if (error) return { ok: false, error: explain(error.message) }
    const { error: versionError } = await sb.from('cms_library_items').insert({
      kind: 'version',
      scope: 'page',
      label: `ก่อนบันทึก ${fn.replace('save_', '')}`,
      content: previous,
    })
    revalidatePath('/') // ล้างแคชหน้า public: คนเปิดเว็บครั้งถัดไปเห็นของใหม่ทันที
    revalidatePath('/admin/library')
    return versionError
      ? { ok: true, error: `เผยแพร่แล้ว แต่บันทึกเวอร์ชันก่อนหน้าไม่สำเร็จ: ${versionError.message}` }
      : { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

const LIBRARY_KINDS: LibraryKind[] = ['draft', 'template']
const LIBRARY_SCOPES: LibraryScope[] = ['page', 'header', 'body', 'footer', 'section']

export async function saveLibraryItem(
  kind: LibraryKind,
  scope: LibraryScope,
  label: string,
  content: unknown,
): Promise<ActionResult> {
  try {
    if (!LIBRARY_KINDS.includes(kind) || !LIBRARY_SCOPES.includes(scope)) {
      return { ok: false, error: 'ชนิดข้อมูลฉบับร่างหรือ template ไม่ถูกต้อง' }
    }
    const cleanLabel = label.trim()
    if (!cleanLabel || cleanLabel.length > 100) {
      return { ok: false, error: 'กรุณาตั้งชื่อไม่เกิน 100 ตัวอักษร' }
    }
    const sb = await guard()
    const { error } = await sb.from('cms_library_items').insert({
      kind, scope, label: cleanLabel, content,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/library')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function saveCurrentPageItem(kind: 'draft' | 'template', label: string): Promise<ActionResult> {
  try {
    const sb = await guard()
    const content = await loadContent(sb)
    return saveLibraryItem(kind, 'page', label, content)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function applyBuiltinPageTemplate(): Promise<ActionResult> {
  try {
    const sb = await guard()
    const current = await loadContent(sb)
    const ids = current.sectionIds
    const content: SiteContent = {
      sectionIds: ids,
      header: sampleHeader(ids.header),
      body: sampleBody(ids.body),
      footer: sampleFooter(ids.footer),
    }
    const payload = contentToPayloads(content)
    const { error } = await sb.rpc('apply_site_snapshot', { p: payload })
    if (error) return { ok: false, error: error.message }
    const { error: versionError } = await sb.from('cms_library_items').insert({
      kind: 'version',
      scope: 'page',
      label: 'ก่อนใช้ template ตัวอย่าง',
      content: current,
    })
    revalidatePath('/')
    revalidatePath('/admin/library')
    return versionError
      ? { ok: true, error: `ใช้ template แล้ว แต่บันทึกเวอร์ชันเดิมไม่สำเร็จ: ${versionError.message}` }
      : { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function publishLibraryItem(id: string): Promise<ActionResult> {
  try {
    const sb = await guard()
    const { data: item, error: readError } = await sb
      .from('cms_library_items')
      .select('kind, scope, label, content')
      .eq('id', id)
      .single()
    if (readError) return { ok: false, error: readError.message }

    const previous = await loadContent(sb)
    if (item.scope === 'page') {
      const { error } = await sb.rpc('apply_site_snapshot', {
        p: contentToPayloads(item.content as SiteContent),
      })
      if (error) return { ok: false, error: error.message }
    } else if (item.scope === 'section') {
      const source = item.content as BodySection
      const freshId = crypto.randomUUID()
      const section: BodySection = {
        ...source,
        id: freshId,
        section_id: previous.sectionIds.body,
        anchor_name: uniqueSectionAnchor(previous.body.map((s) => s.anchor_name), source.anchor_name),
        cards: source.cards.map((card, i) => ({
          ...card, id: crypto.randomUUID(), body_section_id: freshId, sort_order: i + 1,
        })),
        gallery: source.gallery.map((image, i) => ({
          ...image, id: crypto.randomUUID(), body_section_id: freshId, sort_order: i + 1,
        })),
      }
      const { error } = await sb.rpc('save_body', {
        p: toBodyPayload(previous.sectionIds.body, [...previous.body, section]),
      })
      if (error) return { ok: false, error: error.message }
    } else {
      const rpc = item.scope === 'header' ? 'save_header'
        : item.scope === 'body' ? 'save_body'
          : item.scope === 'footer' ? 'save_footer' : null
      if (!rpc) return { ok: false, error: 'ไม่รองรับขอบเขตข้อมูลนี้' }
      const { error } = await sb.rpc(rpc, { p: item.content })
      if (error) return { ok: false, error: error.message }
    }

    const { error: versionError } = await sb.from('cms_library_items').insert({
      kind: 'version',
      scope: 'page',
      label: `ก่อนกู้คืน ${item.label}`,
      content: previous,
    })
    revalidatePath('/')
    revalidatePath('/admin/library')
    return versionError
      ? { ok: true, error: `กู้คืนแล้ว แต่บันทึกเวอร์ชันก่อนหน้าไม่สำเร็จ: ${versionError.message}` }
      : { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function deleteLibraryItem(id: string): Promise<ActionResult> {
  try {
    const sb = await guard()
    const { error } = await sb.from('cms_library_items')
      .delete()
      .eq('id', id)
      .in('kind', ['draft', 'template'])
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/library')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function uniqueSectionAnchor(existing: string[], base: string): string {
  const safe = base || 'section'
  if (!existing.includes(safe)) return safe
  let suffix = 2
  while (existing.includes(`${safe}-${suffix}`)) suffix += 1
  return `${safe}-${suffix}`
}

export async function saveHeader(p: HeaderPayload): Promise<ActionResult> {
  return save('save_header', p)
}
export async function saveBody(p: BodyPayload): Promise<ActionResult> {
  return save('save_body', p)
}
export async function saveFooter(p: FooterPayload): Promise<ActionResult> {
  return save('save_footer', p)
}
