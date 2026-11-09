import type { CSSProperties, ReactNode } from 'react'

/** อนุญาตเฉพาะ http(s), mailto, tel, path ภายในเว็บ และ #anchor (กัน javascript: ฯลฯ) */
export function safeUrl(u?: string | null): string | null {
  if (!u) return null
  const s = u.trim()
  if (!s) return null
  if (/^(https?:|mailto:|tel:)/i.test(s) || s.startsWith('/') || s.startsWith('#')) return s
  return null
}

/** แปลง "เมื่อกด" (none/section/link) เป็น href */
export function hrefFor(action: string, section?: string | null, url?: string | null): string | null {
  if (action === 'section') return section ? `#${section}` : null
  if (action === 'link') return safeUrl(url)
  return null
}

export function A({
  href, newTab, className, style, children,
}: {
  href: string | null
  newTab?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  if (!href) {
    return <span className={className} style={style}>{children}</span>
  }
  return (
    <a
      href={href}
      className={className}
      style={style}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}

export function btnStyle(b: {
  text_color: string
  btn_color: string
  border_width: number
  border_color: string
}): CSSProperties {
  return {
    color: b.text_color,
    background: b.btn_color,
    border: b.border_width > 0 ? `${b.border_width}px solid ${b.border_color}` : '1px solid transparent',
  }
}
