'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, BodyPayload, FooterPayload, HeaderPayload } from '@/lib/types'

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
    const { error } = await sb.rpc(fn, { p })
    if (error) return { ok: false, error: explain(error.message) }
    revalidatePath('/') // ล้างแคชหน้า public: คนเปิดเว็บครั้งถัดไปเห็นของใหม่ทันที
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
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
