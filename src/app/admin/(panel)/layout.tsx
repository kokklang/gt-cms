import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav, SignOutButton } from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (user?.app_metadata?.role !== 'admin') redirect('/admin/login')

  return (
    <div className="adm">
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            แอดมิน<small>/app console</small>
          </div>
          <AdminNav />
          <div className="adm-side-foot">
            <a className="btn" href="/" target="_blank" rel="noopener noreferrer" style={{ justifyContent: 'center' }}>ดูหน้าเว็บ</a>
            <SignOutButton />
          </div>
        </aside>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  )
}
