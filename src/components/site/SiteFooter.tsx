/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react'
import type { ContactPart, FooterColumn, FooterData } from '@/lib/types'
import { PARTS } from '@/lib/meta'
import { A, safeUrl } from './link'

function Part({ col, part }: { col: FooterColumn; part: ContactPart }) {
  const p = col.contacts.find((x) => x.part === part)
  if (!p) return null
  return (
    <div className="ft-part">
      {part === 'line' && col.line_qr_url && <img className="ft-qr" src={col.line_qr_url} alt="QR code LINE" />}
      {p.text_value && (
        <p className="ft-text" style={{ color: col.text_color }}>{p.text_value}</p>
      )}
      {p.btn_enabled && p.btn_label && (
        <A
          href={safeUrl(p.btn_url)}
          className="ft-btn"
          style={{ background: p.btn_bg_color, color: p.btn_text_color }}
        >
          {p.btn_label}
        </A>
      )}
    </div>
  )
}

function Column({ col }: { col: FooterColumn }) {
  if (col.col_type === 'logo') {
    const href = safeUrl(col.logo_link_url)
    return (
      <div>
        <A href={href}>
          {col.logo_url ? (
            <img className="ft-logo" src={col.logo_url} alt={col.logo_text ?? 'โลโก้'} />
          ) : null}
        </A>
        {col.logo_text && (
          <p className="ft-logo-text" style={{ color: col.logo_text_color }}>{col.logo_text}</p>
        )}
      </div>
    )
  }
  return (
    <div>
      {col.title && <h3 className="ft-title" style={{ color: col.text_color }}>{col.title}</h3>}
      {col.col_type === 'links' ? (
        <ul className="ft-list">
          {col.links.map((l) => (
            <li key={l.id}>
              <A href={safeUrl(l.link_url)} style={{ color: l.text_color }}>{l.label}</A>
            </li>
          ))}
        </ul>
      ) : (
        PARTS[col.col_type].map((part) => <Part key={part} col={col} part={part} />)
      )}
    </div>
  )
}

export function SiteFooter({ data }: { data: FooterData }) {
  const c = data.config
  const style: CSSProperties = {
    backgroundColor: c.bg_color,
    backgroundImage: c.bg_image_url ? `url(${JSON.stringify(c.bg_image_url)})` : undefined,
  }
  return (
    <footer className="ft" style={style}>
      {c.bg_image_url && (
        <div className="ft-ov" style={{ background: `rgba(0,0,0,${c.overlay_opacity / 100})` }} />
      )}
      <div
        className="ft-cols"
        style={{ ['--n' as string]: Math.max(1, data.columns.length) } as CSSProperties}
      >
        {data.columns.map((col) => (
          <Column key={col.id} col={col} />
        ))}
      </div>
    </footer>
  )
}
