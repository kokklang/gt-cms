'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import type { HeaderData, NavItem } from '@/lib/types'
import { A, btnStyle, hrefFor } from './link'

function NavBtn({ it, bg }: { it: NavItem; bg: string }) {
  if (it.action === 'dropdown') {
    return (
      <div className="dd" tabIndex={0}>
        <span className="navbtn" style={btnStyle(it)}>
          {it.label} <span aria-hidden="true">▾</span>
        </span>
        <div className="dd-menu" style={{ background: bg }}>
          {it.children.map((ch) => (
            <A
              key={ch.id}
              href={hrefFor(ch.action, ch.target_section, ch.link_url)}
              newTab={ch.open_new_tab}
              className="navbtn"
              style={btnStyle(ch)}
            >
              {ch.label}
            </A>
          ))}
        </div>
      </div>
    )
  }
  return (
    <A
      href={hrefFor(it.action, it.target_section, it.link_url)}
      newTab={it.open_new_tab}
      className="navbtn"
      style={btnStyle(it)}
    >
      {it.label}
    </A>
  )
}

export function SiteHeader({ data }: { data: HeaderData }) {
  const [open, setOpen] = useState(false)
  const c = data.config

  const login = c.login_enabled ? (
    <A
      href={hrefFor(c.login_action, c.login_target_section, c.login_link_url)}
      newTab={c.login_open_new_tab}
      className="hdr-login"
      style={{
        background: c.login_btn_color,
        color: c.login_text_color,
        border: c.login_border_width > 0
          ? `${c.login_border_width}px solid ${c.login_border_color}`
          : '1px solid transparent',
      }}
    >
      {c.login_use_logo && c.login_logo_url && <img src={c.login_logo_url} alt="" />}
      {c.login_text}
    </A>
  ) : null

  return (
    <header
      className="hdr"
      style={{
        backgroundColor: c.bg_color,
        backgroundImage: c.bg_image_url ? `url(${JSON.stringify(c.bg_image_url)})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="hdr-bar">
        <A
          href={hrefFor(c.logo_action, c.logo_target_section, c.logo_link_url)}
          newTab={c.logo_open_new_tab}
          className="hdr-logo"
          style={{ width: c.logo_mode === 'logo' ? `${Math.round(240 * c.logo_width / 100)}px` : undefined }}
        >
          {c.logo_mode === 'logo' && c.logo_url ? (
            <img src={c.logo_url} alt={c.logo_text ?? 'โลโก้'} style={{ width: '100%', maxWidth: 'none', height: 'auto' }} />
          ) : (
            <span>{c.logo_text}</span>
          )}
        </A>
        <nav className="hdr-nav" aria-label="เมนูหลัก">
          {data.items.map((it) => (
            <NavBtn key={it.id} it={it} bg={c.bg_color} />
          ))}
        </nav>
        <div className="hdr-spacer" />
        {login}
        {data.items.length > 0 && (
          <button
            type="button"
            className="hdr-burger"
            aria-label="เปิดเมนู"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        )}
      </div>
      <div className={`hdr-panel${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        {data.items.map((it) => (
          <div key={it.id} className="hdr-panel-group">
            <NavBtnFlat it={it} />
            {it.action === 'dropdown' &&
              it.children.map((ch) => (
                <A
                  key={ch.id}
                  href={hrefFor(ch.action, ch.target_section, ch.link_url)}
                  newTab={ch.open_new_tab}
                  className="navbtn sub"
                  style={btnStyle(ch)}
                >
                  {ch.label}
                </A>
              ))}
          </div>
        ))}
      </div>
    </header>
  )
}

/** ปุ่มในเมนูมือถือ: ดรอปดาวน์แสดงเป็นหัวข้อ แล้วตามด้วยรายการย่อยเรียงลงมา */
function NavBtnFlat({ it }: { it: NavItem }) {
  const href = it.action === 'dropdown' ? null : hrefFor(it.action, it.target_section, it.link_url)
  return (
    <A href={href} newTab={it.open_new_tab} className="navbtn" style={btnStyle(it)}>
      {it.label}
    </A>
  )
}
