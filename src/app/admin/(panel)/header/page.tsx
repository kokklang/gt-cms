import { loadAdminContent } from '@/lib/admin'
import { sampleHeader } from '@/lib/defaults'
import { HeaderEditor } from '@/components/admin/HeaderEditor'

export default async function HeaderPage() {
  const r = await loadAdminContent()
  if (!r.ok) return <div className="adm-notice">เชื่อมฐานข้อมูลไม่สำเร็จ: {r.error}</div>
  const c = r.content
  const saved = c.header !== null
  const initial = c.header ?? sampleHeader(c.sectionIds.header)
  return <HeaderEditor initial={initial} anchors={c.body.map((s) => s.anchor_name)} saved={saved} />
}
