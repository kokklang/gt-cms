import { loadAdminContent } from '@/lib/admin'
import { sampleFooter } from '@/lib/defaults'
import { FooterEditor } from '@/components/admin/FooterEditor'

export default async function FooterPage() {
  const r = await loadAdminContent()
  if (!r.ok) return <div className="adm-notice">เชื่อมฐานข้อมูลไม่สำเร็จ: {r.error}</div>
  const c = r.content
  const saved = c.footer !== null
  const initial = c.footer ?? sampleFooter(c.sectionIds.footer)
  return <FooterEditor initial={initial} saved={saved} />
}
