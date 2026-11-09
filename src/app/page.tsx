import { createPublicClient } from '@/lib/supabase/public'
import { loadContent } from '@/lib/content'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteBody } from '@/components/site/SiteBody'
import { SiteFooter } from '@/components/site/SiteFooter'

// หน้านี้ถูกแคช (ISR) แล้วถูกล้างทันทีที่แอดมินกดบันทึกใน /admin (revalidatePath)
// ตัวเลขนี้เป็นแค่ตาข่ายนิรภัย: ล้างแคชเองทุก 24 ชั่วโมงแม้ไม่มีใครกดบันทึก
export const revalidate = 86400
export const dynamic = 'force-static'

async function getContent() {
  try {
    const sb = createPublicClient()
    if (!sb) return null
    return await loadContent(sb)
  } catch (e) {
    console.error('โหลดเนื้อหาไม่สำเร็จ:', e)
    return null
  }
}

export default async function Home() {
  const c = await getContent()

  if (!c || (!c.header && c.body.length === 0 && !c.footer)) {
    return (
      <div className="empty">
        <p>
          ยังไม่มีเนื้อหาในหน้านี้
          <br />
          เข้าไปสร้างได้ที่ <a href="/admin">/admin</a>
        </p>
      </div>
    )
  }

  return (
    <div className="site">
      {c.header && <SiteHeader data={c.header} />}
      <main>
        <SiteBody sections={c.body} />
      </main>
      {c.footer && <SiteFooter data={c.footer} />}
    </div>
  )
}
