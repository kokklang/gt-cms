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

export function destinationHref(section?: string | null, url?: string | null): string | null {
  return section ? `#${section}` : safeUrl(url)
}

export type VideoSource = { type: 'file' | 'embed'; url: string }

export function videoSource(raw?: string | null): VideoSource | null {
  const url = safeUrl(raw)
  if (!url) return null
  if (url.startsWith('/')) return { type: 'file', url }
  if (!/^https?:/i.test(url)) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { type: 'file', url }
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  let youtubeId: string | null = null
  if (host === 'youtu.be') {
    youtubeId = parsed.pathname.split('/').filter(Boolean)[0] ?? null
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    youtubeId = parsed.searchParams.get('v')
    if (!youtubeId) {
      const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]+)/)
      youtubeId = match?.[1] ?? null
    }
  }
  if (youtubeId && /^[A-Za-z0-9_-]+$/.test(youtubeId)) {
    return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0` }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part))
    if (id) return { type: 'embed', url: `https://player.vimeo.com/video/${id}` }
  }

  return { type: 'file', url }
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
