import { loadAdminContent } from '@/lib/admin'
import { sampleBody } from '@/lib/defaults'
import { BodyEditor } from '@/components/admin/BodyEditor'

export default async function BodyPage() {
  const r = await loadAdminContent()
  if (!r.ok) return <div className="adm-notice">เชื่อมฐานข้อมูลไม่สำเร็จ: {r.error}</div>
  const c = r.content
  const saved = c.body.length > 0
  const initial = saved ? c.body : sampleBody(c.sectionIds.body)
  return <BodyEditor sectionId={c.sectionIds.body} initial={initial} saved={saved} />
}
