'use client'
import { useState } from 'react'
import type {
  ContactPart, FooterColType, FooterColumn, FooterConfig, FooterContact, FooterData,
  FooterPayload,
} from '@/lib/types'
import { newContact, newFooterColumn, newLink } from '@/lib/defaults'
import { FOOTER_TYPES, PARTS, PART_LABEL, PART_TEXT_HINT, PART_URL_HINT } from '@/lib/meta'
import { saveFooter, saveLibraryItem } from '@/app/admin/actions'
import { SiteFooter } from '@/components/site/SiteFooter'
import {
  Btn, Card, Check, Color, ImageField, LinkFields, Num, PreviewFrame, Row, SaveBar, Sel, Text, move, useSaver,
} from './ui'

const MAX_COLS = 4

function ensureContacts(col: FooterColumn): FooterColumn {
  const have = new Set(col.contacts.map((c) => c.part))
  const missing = PARTS[col.col_type].filter((p) => !have.has(p))
  return missing.length
    ? { ...col, contacts: [...col.contacts, ...missing.map((p) => newContact(col.id, p))] }
    : col
}

export function FooterEditor({ initial, saved, anchors }: { initial: FooterData; saved: boolean; anchors: string[] }) {
  const [cfg, setCfg] = useState<FooterConfig>(initial.config)
  const [cols, setCols] = useState<FooterColumn[]>(() => initial.columns.map(ensureContacts))
  const [sel, setSel] = useState(0)
  const [allColor, setAllColor] = useState('#FFFFFF')
  const { st, run } = useSaver()

  const patchCfg = (p: Partial<FooterConfig>) => setCfg((c) => ({ ...c, ...p }))
  const patchCol = (i: number, p: Partial<FooterColumn>) =>
    setCols((a) => a.map((c, k) => (k === i ? { ...c, ...p } : c)))

  function setType(i: number, type: FooterColType) {
    setCols((a) =>
      a.map((c, k) => {
        if (k !== i) return c
        const n = ensureContacts({ ...c, col_type: type })
        if (type === 'links' && n.links.length === 0) n.links = [newLink(n.id, 1, n.text_color)]
        return n
      }),
    )
  }
  function addCol() {
    if (cols.length >= MAX_COLS) return
    setCols((a) => [...a, newFooterColumn(cfg.id, a.length + 1, 'links')])
    setSel(cols.length)
  }
  function delCol() {
    if (cols.length <= 1) return
    setCols((a) => a.filter((_, k) => k !== sel))
    setSel(Math.max(0, sel - 1))
  }
  function patchContact(i: number, part: ContactPart, p: Partial<FooterContact>) {
    setCols((a) =>
      a.map((c, k) =>
        k === i ? { ...c, contacts: c.contacts.map((x) => (x.part === part ? { ...x, ...p } : x)) } : c,
      ),
    )
  }

  const col = cols[sel] ?? null

  function patchLink(j: number, p: Partial<FooterColumn['links'][number]>) {
    if (!col) return
    patchCol(sel, { links: col.links.map((l, m) => (m === j ? { ...l, ...p } : l)) })
  }

  function getPayload(): FooterPayload {
    return {
      config: cfg,
      columns: cols.map(({ links: _l, contacts: _c, ...c }, i) => ({ ...c, footer_id: cfg.id, position: i + 1 })),
      links: cols.flatMap((c) =>
        c.col_type === 'links' ? c.links.map((l, j) => ({ ...l, column_id: c.id, sort_order: j + 1 })) : [],
      ),
      contacts: cols.flatMap((c) =>
        c.contacts.filter((x) => PARTS[c.col_type].includes(x.part)).map((x) => ({ ...x, column_id: c.id })),
      ),
    }
  }

  function onSave() {
    run(() => saveFooter(getPayload()))
  }

  function saveLocal(kind: 'draft' | 'template') {
    const label = window.prompt(kind === 'draft' ? 'ตั้งชื่อฉบับร่าง footer' : 'ตั้งชื่อ template footer')
    if (!label?.trim()) return
    run(() => saveLibraryItem(kind, 'footer', label, getPayload()))
  }

  return (
    <>
      <h1>footer</h1>
      <p className="adm-sub">1–{MAX_COLS} คอลัมน์ เลือกชนิดของแต่ละคอลัมน์ได้เอง + สีและรูปพื้นหลัง</p>
      {!saved && <div className="adm-notice">ยังไม่เคยบันทึก: กำลังแสดงค่าตัวอย่าง กด “บันทึกและเผยแพร่” เพื่อใช้จริง</div>}

      <div className="adm-grid">
        <div className="adm-ctrls">
          <Card title="พื้นหลัง footer">
            <Color label="สี footer" value={cfg.bg_color} onChange={(bg_color) => patchCfg({ bg_color })} />
            <ImageField label="รูปพื้นหลัง" value={cfg.bg_image_url} folder="footer" hint="แนะนำ 1920×600 px" onChange={(bg_image_url) => patchCfg({ bg_image_url })} />
            {cfg.bg_image_url && (
              <Row label="ความเข้มทับรูป">
                <input type="range" min={0} max={90} step={5} value={cfg.overlay_opacity} onChange={(e) => patchCfg({ overlay_opacity: Number(e.target.value) })} />
                <span className="adm-hex">{cfg.overlay_opacity}%</span>
              </Row>
            )}
          </Card>

          <Card title={`คอลัมน์ (${cols.length}/${MAX_COLS})`}>
            <div className="chips">
              {cols.map((c, i) => (
                <button key={c.id} type="button" className={`chip${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
                  คอลัมน์ {i + 1}
                </button>
              ))}
            </div>
            <div className="adm-actions">
              <Btn sm onClick={addCol} disabled={cols.length >= MAX_COLS}>+ เพิ่มคอลัมน์</Btn>
              <Btn sm kind="danger" onClick={delCol} disabled={cols.length <= 1}>ลบคอลัมน์นี้</Btn>
              <Btn sm disabled={sel === 0} onClick={() => { setCols((a) => move(a, sel, -1)); setSel(sel - 1) }}>←</Btn>
              <Btn sm disabled={sel >= cols.length - 1} onClick={() => { setCols((a) => move(a, sel, 1)); setSel(sel + 1) }}>→</Btn>
            </div>
            {cols.length >= MAX_COLS && <p className="adm-warn" style={{ margin: '0 0 10px' }}>มีคอลัมน์ได้สูงสุด {MAX_COLS} คอลัมน์</p>}

            {col && (
              <>
                <hr className="adm-sep" />
                <Sel label="ชนิดคอลัมน์" value={col.col_type} options={FOOTER_TYPES} onChange={(v) => setType(sel, v as FooterColType)} />

                {col.col_type === 'logo' ? (
                  <>
                    <ImageField
                      label="โลโก้" value={col.logo_url} folder="footer" hint="แนะนำภาพสี่เหลี่ยม 400×400 px"
                      width={col.logo_width}
                      onWidthChange={(logo_width) => patchCol(sel, { logo_width })}
                      onChange={(logo_url) => patchCol(sel, { logo_url })}
                    />
                    <LinkFields
                      target={col.logo_target_section} link={col.logo_link_url}
                      openNewTab={col.logo_open_new_tab} anchors={anchors}
                      onChange={(p) => patchCol(sel, {
                        ...(p.target_section !== undefined ? { logo_target_section: p.target_section } : {}),
                        ...(p.link_url !== undefined ? { logo_link_url: p.link_url } : {}),
                        ...(p.open_new_tab !== undefined ? { logo_open_new_tab: p.open_new_tab } : {}),
                      })}
                    />
                    <Text label="ข้อความใต้โลโก้" value={col.logo_text} hint="อยู่กึ่งกลางใต้โลโก้" onChange={(v) => patchCol(sel, { logo_text: v || null })} />
                    <Color label="สีข้อความ" value={col.logo_text_color} onChange={(logo_text_color) => patchCol(sel, { logo_text_color })} />
                  </>
                ) : (
                  <>
                    <Text label="หัวข้อ" value={col.title} onChange={(v) => patchCol(sel, { title: v || null })} />
                    <Color label="สีหัวข้อ/ข้อความ" value={col.text_color} onChange={(text_color) => patchCol(sel, { text_color })} />
                  </>
                )}

                {col.col_type === 'links' && (
                  <>
                    <p className="adm-subh">รายการลิงก์</p>
                    <div className="adm-box">
                      <Row label="สีทั้งหมด">
                        <input type="color" value={allColor} onChange={(e) => setAllColor(e.target.value.toUpperCase())} />
                        <Btn sm onClick={() => patchCol(sel, { links: col.links.map((l) => ({ ...l, text_color: allColor })) })}>ใช้กับทุกรายการ</Btn>
                      </Row>
                    </div>
                    {col.links.map((l, j) => (
                      <div className="adm-box" key={l.id}>
                        <Text label="ข้อความ" value={l.label} onChange={(label) => patchLink(j, { label })} />
                        <LinkFields
                          target={l.target_section} link={l.link_url} openNewTab={l.open_new_tab} anchors={anchors}
                          onChange={(p) => patchLink(j, {
                            ...(p.target_section !== undefined ? { target_section: p.target_section } : {}),
                            ...(p.link_url !== undefined ? { link_url: p.link_url } : {}),
                            ...(p.open_new_tab !== undefined ? { open_new_tab: p.open_new_tab } : {}),
                          })}
                        />
                        <Color label="สีข้อความ" value={l.text_color} onChange={(text_color) => patchLink(j, { text_color })} />
                        <div className="adm-actions" style={{ marginBottom: 0 }}>
                          <Btn sm disabled={j === 0} onClick={() => patchCol(sel, { links: move(col.links, j, -1) })}>↑</Btn>
                          <Btn sm disabled={j >= col.links.length - 1} onClick={() => patchCol(sel, { links: move(col.links, j, 1) })}>↓</Btn>
                          <Btn sm kind="danger" onClick={() => patchCol(sel, { links: col.links.filter((_, m) => m !== j) })}>ลบ</Btn>
                        </div>
                      </div>
                    ))}
                    <Btn sm onClick={() => patchCol(sel, { links: [...col.links, newLink(col.id, col.links.length + 1, allColor)] })}>+ เพิ่มรายการ</Btn>
                  </>
                )}

                {PARTS[col.col_type].map((part) => {
                  const c = col.contacts.find((x) => x.part === part)
                  if (!c) return null
                  return (
                    <div key={part}>
                      <hr className="adm-sep" />
                      <p className="adm-subh">{PART_LABEL[part]}</p>
                      <Text label={PART_TEXT_HINT[part]} value={c.text_value} area={part === 'map'} onChange={(text_value) => patchContact(sel, part, { text_value })} />
                      {part === 'line' && (
                        <ImageField label="QR code" value={col.line_qr_url} folder="footer" hint="แนะนำ 300×300 px" onChange={(line_qr_url) => patchCol(sel, { line_qr_url })} />
                      )}
                      <Check label="มีปุ่มกด" checked={c.btn_enabled} onChange={(btn_enabled) => patchContact(sel, part, { btn_enabled })} />
                      {c.btn_enabled && (
                        <>
                          <Text label="ข้อความปุ่ม" value={c.btn_label} onChange={(btn_label) => patchContact(sel, part, { btn_label })} />
                          <Color label="สีปุ่ม" value={c.btn_bg_color} onChange={(btn_bg_color) => patchContact(sel, part, { btn_bg_color })} />
                          <Color label="สีข้อความปุ่ม" value={c.btn_text_color} onChange={(btn_text_color) => patchContact(sel, part, { btn_text_color })} />
                          <Num label="ความหนาขอบ" value={c.btn_border_width} min={0} max={6} hint="0 = ไม่มีขอบ" onChange={(btn_border_width) => patchContact(sel, part, { btn_border_width })} />
                          <Color label="สีขอบ" value={c.btn_border_color} onChange={(btn_border_color) => patchContact(sel, part, { btn_border_color })} />
                          <LinkFields
                            target={c.btn_target_section} link={c.btn_url} openNewTab={c.btn_open_new_tab} anchors={anchors}
                            onChange={(p) => patchContact(sel, part, {
                              ...(p.target_section !== undefined ? { btn_target_section: p.target_section } : {}),
                              ...(p.link_url !== undefined ? { btn_url: p.link_url } : {}),
                              ...(p.open_new_tab !== undefined ? { btn_open_new_tab: p.open_new_tab } : {}),
                            })}
                          />
                          <p className="adm-sub" style={{ fontSize: '.78rem', margin: 0 }}>ประเภทลิงก์ที่แนะนำ: {PART_URL_HINT[part]}</p>
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </Card>
        </div>

        <PreviewFrame title="พรีวิว footer">
          <SiteFooter data={{ config: cfg, columns: cols }} />
        </PreviewFrame>
      </div>

      <SaveBar
        st={st}
        onSave={onSave}
        onDraft={() => saveLocal('draft')}
        onTemplate={() => saveLocal('template')}
        dirtyNote="ยังไม่ได้บันทึกการเปลี่ยนแปลง"
      />
    </>
  )
}
