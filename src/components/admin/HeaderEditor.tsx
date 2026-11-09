'use client'
import { useState } from 'react'
import type { ClickAction, HeaderConfig, HeaderData, HeaderPayload, NavChild, NavItem } from '@/lib/types'
import { newNavChild, newNavItem } from '@/lib/defaults'
import { saveHeader } from '@/app/admin/actions'
import { SiteHeader } from '@/components/site/SiteHeader'
import {
  ActionFields, Btn, Card, Check, Color, ImageField, Num, PreviewFrame, Row,
  SaveBar, Text, move, useSaver,
} from './ui'

const MAX_ITEMS = 8

type BtnVals = {
  label: string
  action: ClickAction
  target_section: string | null
  link_url: string | null
  open_new_tab: boolean
  text_color: string
  btn_color: string
  border_width: number
  border_color: string
}

function ButtonFields({
  v, onPatch, anchors, allowDropdown,
}: {
  v: BtnVals
  onPatch: (p: Partial<BtnVals>) => void
  anchors: string[]
  allowDropdown: boolean
}) {
  return (
    <>
      <Text label="ข้อความ" value={v.label} onChange={(label) => onPatch({ label })} />
      <ActionFields
        action={v.action} target={v.target_section} link={v.link_url}
        anchors={anchors} allowDropdown={allowDropdown}
        onChange={(a) => onPatch({ action: a.action, target_section: a.target, link_url: a.link })}
      />
      {(v.action === 'link' || v.action === 'section') && (
        <Check label="เปิดแท็บใหม่" checked={v.open_new_tab} onChange={(open_new_tab) => onPatch({ open_new_tab })} />
      )}
      <Color label="สีตัวหนังสือ" value={v.text_color} onChange={(text_color) => onPatch({ text_color })} />
      <Color label="สีปุ่ม" value={v.btn_color} onChange={(btn_color) => onPatch({ btn_color })} />
      <Num label="ความหนาขอบ" value={v.border_width} min={0} max={6} hint="0 = ไม่มีขอบ" onChange={(border_width) => onPatch({ border_width })} />
      {v.border_width > 0 && (
        <Color label="สีขอบ" value={v.border_color} onChange={(border_color) => onPatch({ border_color })} />
      )}
    </>
  )
}

export function HeaderEditor({
  initial, anchors, saved,
}: {
  initial: HeaderData
  anchors: string[]
  saved: boolean
}) {
  const [cfg, setCfg] = useState<HeaderConfig>(initial.config)
  const [items, setItems] = useState<NavItem[]>(initial.items)
  const [sel, setSel] = useState(0)
  const [selC, setSelC] = useState(-1)
  const { st, run } = useSaver()

  const patchCfg = (p: Partial<HeaderConfig>) => setCfg((c) => ({ ...c, ...p }))

  function patchItem(i: number, p: Partial<NavItem>) {
    setItems((a) =>
      a.map((x, k) => {
        if (k !== i) return x
        const n = { ...x, ...p }
        if (n.action === 'dropdown' && n.children.length === 0) {
          n.children = [newNavChild(n.id, 1), newNavChild(n.id, 2)]
        }
        return n
      }),
    )
    if (p.action && p.action !== 'dropdown') setSelC(-1)
  }
  function patchChild(i: number, j: number, p: Partial<NavChild>) {
    setItems((a) =>
      a.map((x, k) =>
        k === i ? { ...x, children: x.children.map((c, m) => (m === j ? { ...c, ...p } : c)) } : x,
      ),
    )
  }
  function addItem() {
    if (items.length >= MAX_ITEMS) return
    setItems((a) => [...a, newNavItem(cfg.id, a.length + 1)])
    setSel(items.length)
    setSelC(-1)
  }
  function delItem() {
    if (!items[sel]) return
    setItems((a) => a.filter((_, k) => k !== sel))
    setSel(Math.max(0, sel - 1))
    setSelC(-1)
  }
  function addChild() {
    const it = items[sel]
    if (!it) return
    patchItem(sel, { children: [...it.children, newNavChild(it.id, it.children.length + 1)] })
    setSelC(it.children.length)
  }
  function delChild() {
    const it = items[sel]
    if (!it || selC < 0) return
    patchItem(sel, { children: it.children.filter((_, k) => k !== selC) })
    setSelC(-1)
  }

  const cur = items[sel] ?? null
  const child = cur && selC >= 0 ? cur.children[selC] ?? null : null

  function onSave() {
    const payload: HeaderPayload = {
      config: cfg,
      items: items.map(({ children: _c, ...it }, i) => ({ ...it, header_id: cfg.id, sort_order: i + 1 })),
      children: items.flatMap((it) =>
        it.action === 'dropdown'
          ? it.children.map((c, j) => ({ ...c, nav_item_id: it.id, sort_order: j + 1 }))
          : [],
      ),
    }
    run(() => saveHeader(payload))
  }

  return (
    <>
      <h1>header / navbar</h1>
      <p className="adm-sub">3 โซน: hero / โลโก้ · ปุ่มนำทาง (สูงสุด {MAX_ITEMS} ปุ่ม) · ช่องล็อกอิน</p>
      {!saved && <div className="adm-notice">ยังไม่เคยบันทึก: กำลังแสดงค่าตัวอย่าง กด “บันทึกและเผยแพร่” เพื่อใช้จริง</div>}

      <div className="adm-grid">
        <div className="adm-ctrls">
          <Card title="1 · hero / โลโก้">
            <Row label="ใช้">
              <label><input type="radio" name="logo_mode" checked={cfg.logo_mode === 'text'} onChange={() => patchCfg({ logo_mode: 'text' })} /> ข้อความ</label>
              <label><input type="radio" name="logo_mode" checked={cfg.logo_mode === 'logo'} onChange={() => patchCfg({ logo_mode: 'logo' })} /> โลโก้</label>
            </Row>
            {cfg.logo_mode === 'text' ? (
              <Text label="ข้อความ" value={cfg.logo_text} onChange={(logo_text) => patchCfg({ logo_text })} />
            ) : (
              <ImageField label="โลโก้" value={cfg.logo_url} folder="header" hint="แนะนำสูง ~80 px พื้นโปร่งใส" onChange={(logo_url) => patchCfg({ logo_url })} />
            )}
            <ActionFields
              action={cfg.logo_action} target={cfg.logo_target_section} link={cfg.logo_link_url} anchors={anchors}
              onChange={(a) => patchCfg({ logo_action: a.action as HeaderConfig['logo_action'], logo_target_section: a.target, logo_link_url: a.link })}
            />
            <Color label="สีพื้น header" value={cfg.bg_color} onChange={(bg_color) => patchCfg({ bg_color })} />
          </Card>

          <Card title={`2 · ปุ่มนำทาง (${items.length}/${MAX_ITEMS})`}>
            <div className="chips">
              {items.length === 0 && <span style={{ color: 'var(--muted)' }}>ไม่มีปุ่ม</span>}
              {items.map((it, i) => (
                <button key={it.id} type="button" className={`chip${i === sel && selC < 0 ? ' on' : ''}`} onClick={() => { setSel(i); setSelC(-1) }}>
                  {i + 1}. {it.label || '(ไม่มีชื่อ)'}
                </button>
              ))}
            </div>
            <div className="adm-actions">
              <Btn sm onClick={addItem} disabled={items.length >= MAX_ITEMS}>+ เพิ่มปุ่ม</Btn>
              <Btn sm kind="danger" onClick={delItem} disabled={!cur}>ลบปุ่มนี้</Btn>
              <Btn sm onClick={() => { setItems((a) => move(a, sel, -1)); setSel(Math.max(0, sel - 1)) }} disabled={!cur || sel === 0}>↑</Btn>
              <Btn sm onClick={() => { setItems((a) => move(a, sel, 1)); setSel(Math.min(items.length - 1, sel + 1)) }} disabled={!cur || sel >= items.length - 1}>↓</Btn>
            </div>
            {items.length >= MAX_ITEMS && <p className="adm-warn" style={{ margin: '0 0 10px' }}>มีปุ่มนำทางได้สูงสุด {MAX_ITEMS} ปุ่ม</p>}

            {cur && cur.action === 'dropdown' && (
              <>
                <p className="adm-subh">รายการย่อยใน “{cur.label}”</p>
                <div className="chips">
                  <button type="button" className={`chip${selC < 0 ? ' on' : ''}`} onClick={() => setSelC(-1)}>ตัวปุ่มหลัก</button>
                  {cur.children.map((ch, j) => (
                    <button key={ch.id} type="button" className={`chip${j === selC ? ' on' : ''}`} onClick={() => setSelC(j)}>
                      {ch.label || '(ไม่มีชื่อ)'}
                    </button>
                  ))}
                </div>
                <div className="adm-actions">
                  <Btn sm onClick={addChild}>+ เพิ่มรายการย่อย</Btn>
                  <Btn sm kind="danger" onClick={delChild} disabled={selC < 0}>ลบรายการย่อย</Btn>
                  <Btn sm disabled={selC < 0 || selC === 0} onClick={() => { patchItem(sel, { children: move(cur.children, selC, -1) }); setSelC(selC - 1) }}>↑</Btn>
                  <Btn sm disabled={selC < 0 || selC >= cur.children.length - 1} onClick={() => { patchItem(sel, { children: move(cur.children, selC, 1) }); setSelC(selC + 1) }}>↓</Btn>
                </div>
              </>
            )}

            {cur && <hr className="adm-sep" />}
            {cur && (child ? (
              <>
                <p className="adm-subh">กำลังแก้รายการย่อยที่ {selC + 1} (ซ้อนดรอปดาวน์ไม่ได้)</p>
                <ButtonFields v={child} anchors={anchors} allowDropdown={false} onPatch={(p) => patchChild(sel, selC, p as Partial<NavChild>)} />
              </>
            ) : (
              <>
                <p className="adm-subh">กำลังแก้ปุ่มที่ {sel + 1}</p>
                <ButtonFields v={cur} anchors={anchors} allowDropdown onPatch={(p) => patchItem(sel, p)} />
              </>
            ))}
          </Card>

          <Card title="3 · ช่องล็อกอิน">
            <Check label="แสดงช่อง" checked={cfg.login_enabled} onChange={(login_enabled) => patchCfg({ login_enabled })} />
            {cfg.login_enabled && (
              <>
                <Check label="ใส่โลโก้" checked={cfg.login_use_logo} onChange={(login_use_logo) => patchCfg({ login_use_logo })} />
                {cfg.login_use_logo && (
                  <ImageField label="โลโก้" value={cfg.login_logo_url} folder="header" hint="แนะนำสูง ~36 px" onChange={(login_logo_url) => patchCfg({ login_logo_url })} />
                )}
                <Text label="ข้อความ" value={cfg.login_text} onChange={(login_text) => patchCfg({ login_text })} />
                <Color label="สีข้อความ" value={cfg.login_text_color} onChange={(login_text_color) => patchCfg({ login_text_color })} />
                <Color label="สีปุ่ม" value={cfg.login_btn_color} onChange={(login_btn_color) => patchCfg({ login_btn_color })} />
                <ActionFields
                  action={cfg.login_action} target={cfg.login_target_section} link={cfg.login_link_url} anchors={anchors}
                  onChange={(a) => patchCfg({ login_action: a.action as HeaderConfig['login_action'], login_target_section: a.target, login_link_url: a.link })}
                />
              </>
            )}
          </Card>
        </div>

        <PreviewFrame title="พรีวิว header">
          <SiteHeader data={{ config: cfg, items }} />
        </PreviewFrame>
      </div>

      <SaveBar st={st} onSave={onSave} dirtyNote="ยังไม่ได้บันทึกการเปลี่ยนแปลง" />
    </>
  )
}
