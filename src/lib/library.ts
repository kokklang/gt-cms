import { createClient } from '@/lib/supabase/server'
import type { LibraryItemSummary } from './types'

export async function loadLibraryItems(): Promise<{ items: LibraryItemSummary[]; error: string | null }> {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user?.app_metadata?.role !== 'admin') return { items: [], error: 'ไม่มีสิทธิ์แอดมิน' }

    const { data, error } = await sb
      .from('cms_library_items')
      .select('id, kind, scope, label, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return { items: [], error: error.message }
    return { items: (data ?? []) as LibraryItemSummary[], error: null }
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) }
  }
}
