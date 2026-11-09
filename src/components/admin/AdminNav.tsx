'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

const ITEMS: { href: string; label: string; off?: boolean }[] = [
  { href: '/admin', label: 'ภาพรวม' },
  { href: '/admin/header', label: 'header / navbar' },
  { href: '/admin/body', label: 'body' },
  { href: '/admin/footer', label: 'footer' },
  { href: '/admin/library', label: 'เวอร์ชัน · Template' },
  { href: '#', label: 'seo (เร็วๆ นี้)', off: true },
]

export function AdminNav() {
  const path = usePathname()
  return (
    <nav aria-label="เมนูแอดมิน" style={{ display: 'grid', gap: 2 }}>
      {ITEMS.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          aria-disabled={it.off}
          tabIndex={it.off ? -1 : undefined}
          className={`adm-navlink${path === it.href ? ' on' : ''}${it.off ? ' off' : ''}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}

export function SignOutButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        await createClient().auth.signOut()
        router.replace('/admin/login')
        router.refresh()
      }}
    >
      ออกจากระบบ
    </button>
  )
}
