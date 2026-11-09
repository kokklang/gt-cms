/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react'
import type { BodySection } from '@/lib/types'
import { tplOf } from '@/lib/meta'
import { A, safeUrl } from './link'

const SIZE = { s: 0.85, m: 1, l: 1.35 } as const
const ALIGN = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function Title({ s, h1 }: { s: BodySection; h1?: boolean }) {
  if (!s.show_title || !s.title) return null
  const base = tplOf(s.template).type === 'hero' ? 2.4 : 1.7
  const style: CSSProperties = { color: s.title_color, fontSize: `${base * SIZE[s.title_size]}rem` }
  const Tag = h1 ? 'h1' : 'h2'
  return (
    <Tag className="ttl" style={style}>
      {s.title_url ? <A href={safeUrl(s.title_url)}>{s.title}</A> : s.title}
    </Tag>
  )
}

function Text({ s }: { s: BodySection }) {
  if (!s.show_body || !s.body_text) return null
  return (
    <p className="txt" style={{ color: s.body_color }}>
      {s.body_url ? <A href={safeUrl(s.body_url)}>{s.body_text}</A> : s.body_text}
    </p>
  )
}

function Btn({ s }: { s: BodySection }) {
  if (!s.btn_enabled || !s.btn_label) return null
  return (
    <div>
      <A
        href={safeUrl(s.btn_url)}
        className="s-btn"
        style={{ background: s.btn_bg_color, color: s.btn_text_color, borderRadius: s.btn_radius }}
      >
        {s.btn_label}
      </A>
    </div>
  )
}

function TextBlock({ s, h1 }: { s: BodySection; h1?: boolean }) {
  return (
    <div className="flexcol" style={{ textAlign: s.text_align, alignItems: ALIGN[s.text_align] }}>
      <Title s={s} h1={h1} />
      <Text s={s} />
      <Btn s={s} />
    </div>
  )
}

function Section({ s, first, selected }: { s: BodySection; first: boolean; selected: boolean }) {
  const type = tplOf(s.template).type
  const cls = `s-sec${selected ? ' s-sel' : ''}`
  const common = { id: s.anchor_name, className: cls }

  if (type === 'hero') {
    const style: CSSProperties = {
      backgroundColor: s.bg_color,
      backgroundImage: s.image_url ? `url(${JSON.stringify(s.image_url)})` : undefined,
    }
    return (
      <section {...common} className={`${cls} s-hero`} style={style}>
        {s.image_url && <div className="s-ov" />}
        <div className="wrap">
          <TextBlock s={s} h1={first} />
        </div>
      </section>
    )
  }

  if (type === 'textimg') {
    const img = s.image_url ? (
      <A href={safeUrl(s.image_link_url)}>
        <img className="ti-img" src={s.image_url} alt={s.title ?? ''} loading="lazy" />
      </A>
    ) : null
    const text = <TextBlock s={s} h1={first} />
    return (
      <section {...common} style={{ background: s.bg_color }}>
        <div className={`wrap ti-grid${img ? '' : ' single'}`}>
          {s.template === 'ti-l' ? <>{img}{text}</> : <>{text}{img}</>}
        </div>
      </section>
    )
  }

  if (type === 'cards') {
    const cols = Math.min(s.cards.length, 3) || 1
    return (
      <section {...common} style={{ background: s.bg_color }}>
        <div className="wrap">
          <div style={{ textAlign: s.text_align }}>
            <Title s={s} h1={first} />
          </div>
          <div className="s-cards" style={{ ['--cols' as string]: cols } as CSSProperties}>
            {s.cards.map((c) => {
              const inner = (
                <>
                  <h3 style={{ color: c.title_color }}>{c.title}</h3>
                  <p style={{ color: c.desc_color }}>{c.description}</p>
                </>
              )
              const st: CSSProperties = { background: c.bg_color, borderColor: c.border_color }
              const href = safeUrl(c.link_url)
              return href ? (
                <A key={c.id} href={href} className="s-card" style={st}>{inner}</A>
              ) : (
                <div key={c.id} className="s-card" style={st}>{inner}</div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (type === 'gallery') {
    const cols = s.template === 'gal2' ? 2 : 3
    return (
      <section {...common} style={{ background: s.bg_color }}>
        <div className="wrap">
          <div style={{ textAlign: s.text_align }}>
            <Title s={s} h1={first} />
          </div>
          <div className="s-gal" style={{ ['--cols' as string]: cols } as CSSProperties}>
            {s.gallery.map((g) => (
              <A key={g.id} href={safeUrl(g.link_url)}>
                <img src={g.image_url} alt="" loading="lazy" />
              </A>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // cta, text
  return (
    <section {...common} style={{ background: s.bg_color }}>
      <div className="wrap">
        <TextBlock s={s} h1={first} />
      </div>
    </section>
  )
}

export function SiteBody({ sections, selectedId }: { sections: BodySection[]; selectedId?: string }) {
  return (
    <>
      {sections.map((s, i) => (
        <Section key={s.id} s={s} first={i === 0} selected={s.id === selectedId} />
      ))}
    </>
  )
}
