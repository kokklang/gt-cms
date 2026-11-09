import { createClient } from '@supabase/supabase-js'

/** client สำหรับหน้า public: อ่านด้วย anon key เท่านั้น ไม่ใช้ cookie (จึงแคช/ISR ได้) */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
