import { createClient } from '@/lib/supabase/server'
import { loadContent } from '@/lib/content'
import type { SiteContent } from '@/lib/types'

export type AdminLoad = { ok: true; content: SiteContent } | { ok: false; error: string }

/** โหลดเนื้อหาด้วย session ของแอดมิน (ใช้ในหน้า /admin ทุกหน้า) */
export async function loadAdminContent(): Promise<AdminLoad> {
  try {
    const sb = await createClient()
    const content = await loadContent(sb)
    const ids = content.sectionIds
    if (!ids.header || !ids.body || !ids.footer) {
      return { ok: false, error: 'ไม่พบแถวใน site_sections (header/body/footer): รัน supabase/schema.sql ให้ครบก่อน' }
    }
    return { ok: true, content }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
