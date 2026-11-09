import Link from 'next/link'
import { loadAdminContent } from '@/lib/admin'

export default async function Dashboard() {
  const r = await loadAdminContent()
  if (!r.ok) {
    return (
      <>
        <h1>จัดการหน้าเว็บไซต์</h1>
        <div className="adm-notice">เชื่อมฐานข้อมูลไม่สำเร็จ: {r.error}</div>
      </>
    )
  }
  const c = r.content
  const tiles = [
    { href: '/admin/header', title: 'header / navbar', note: c.header ? `ปุ่มนำทาง ${c.header.items.length} ปุ่ม` : 'ยังไม่ได้บันทึก (ใช้ค่าตัวอย่าง)' },
    { href: '/admin/body', title: 'body', note: c.body.length ? `${c.body.length} section` : 'ยังไม่ได้บันทึก (ใช้ค่าตัวอย่าง)' },
    { href: '/admin/footer', title: 'footer', note: c.footer ? `${c.footer.columns.length} คอลัมน์` : 'ยังไม่ได้บันทึก (ใช้ค่าตัวอย่าง)' },
  ]
  return (
    <>
      <h1>จัดการหน้าเว็บไซต์</h1>
      <p className="adm-sub">แก้ไขแล้วกด “บันทึกและเผยแพร่” หน้าเว็บอัปเดตทันที ไม่ต้อง build ใหม่</p>
      <div className="adm-tiles">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="adm-tile">
            <h3>{t.title}</h3>
            <p>{t.note}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
