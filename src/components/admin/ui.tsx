'use client'
/* eslint-disable @next/next/no-img-element */
import { useState, type ChangeEvent, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { ActionResult, ClickAction } from '@/lib/types'

export type Opt = [string, string]

export function Card({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="adm-card">
      <div className="adm-card-h">
        <h3>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Row({ label, hint, children }: { label?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="adm-row">
      <label>{label ?? ''}</label>
      <div className="adm-ctl">
        {children}
        {hint && <small>{hint}</small>}
      </div>
    </div>
  )
}

export function Text({
  label, value, onChange, placeholder, area, hint,
}: {
  label: string
  value: string | null
  onChange: (v: string) => void
  placeholder?: string
  area?: boolean
  hint?: string
}) {
  return (
    <Row label={label} hint={hint ?? (area ? 'พิมพ์ข้อความและขึ้นบรรทัดใหม่ได้' : 'กรอกข้อมูลที่ต้องการแสดงบนเว็บไซต์')}>
      {area ? (
        <textarea rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Row>
  )
}

export function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label} hint="เลือกสีที่ต้องการ ระบบจะแสดงรหัสสีด้านข้าง">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} />
      <span className="adm-hex">{value}</span>
    </Row>
  )
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint ?? 'เปิดหรือปิดตัวเลือกนี้'}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Row>
  )
}

export function Sel({ label, value, options, onChange }: { label: string; value: string; options: Opt[]; onChange: (v: string) => void }) {
  return (
    <Row label={label} hint="เลือกตัวเลือกที่ต้องการ">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </Row>
  )
}

export function Num({ label, value, min, max, onChange, hint }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <Row label={label} hint={hint ?? `เลือกค่าระหว่าง ${min}–${max}`}>
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
      />
    </Row>
  )
}

export function Btn({
  children, onClick, kind, sm, disabled, title,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'danger'
  sm?: boolean
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button" title={title} disabled={disabled} onClick={onClick}
      className={`btn${kind ? ' ' + kind : ''}${sm ? ' sm' : ''}`}
    >
      {children}
    </button>
  )
}

/* ───────── อัปโหลดรูปขึ้น Supabase Storage (bucket site-assets) ───────── */
const MAX_BYTES = 5 * 1024 * 1024

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('เลือกได้เฉพาะไฟล์รูปภาพ')
  if (file.size > MAX_BYTES) throw new Error('ไฟล์ใหญ่เกิน 5 MB')
  const sb = createClient()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${folder}/${crypto.randomUUID()}.${ext || 'png'}`
  const { error } = await sb.storage.from('site-assets').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
  })
  if (error) throw new Error(error.message)
  return sb.storage.from('site-assets').getPublicUrl(path).data.publicUrl
}

export function ImageSizeChoices({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="adm-image-sizes" aria-label="ขนาดรูปแนะนำ">
      {([[50, 'เล็ก'], [75, 'กลาง'], [100, 'ใหญ่']] as const).map(([v, label]) => (
        <button
          key={v}
          type="button"
          className={`chip${value === v ? ' on' : ''}`}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function ImageField({
  label, value, onChange, folder, hint, width, onWidthChange,
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
  folder: string
  hint?: string
  width?: number
  onWidthChange?: (v: number) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    setErr('')
    try {
      onChange(await uploadImage(f, folder))
    } catch (x) {
      setErr(x instanceof Error ? x.message : String(x))
    }
    setBusy(false)
  }

  return (
    <Row label={label} hint={hint ?? 'เลือกภาพประกอบ ขนาดไฟล์ไม่เกิน 5 MB'}>
      {value ? <img className="adm-thumb" src={value} alt="" /> : <span className="adm-thumb" />}
      {onWidthChange && (
        <ImageSizeChoices value={width ?? 100} onChange={onWidthChange} />
      )}
      <label className="btn sm">
        <input type="file" accept="image/*" hidden onChange={pick} />
        {busy ? 'กำลังอัปโหลด…' : 'เลือกไฟล์'}
      </label>
      {value && <Btn sm kind="danger" onClick={() => onChange(null)}>ลบ</Btn>}
      {err && <small className="adm-warn">{err}</small>}
    </Row>
  )
}

export function LinkFields({
  target, link, openNewTab, anchors, onChange,
}: {
  target: string | null
  link: string | null
  openNewTab: boolean
  anchors: string[]
  onChange: (p: { target_section?: string | null; link_url?: string | null; open_new_tab?: boolean }) => void
}) {
  const missing = !!target && !anchors.includes(target)
  const sections: Opt[] = [['', 'ไม่เลือก section'], ...anchors.map((a): Opt => [a, a])]
  if (missing && target) sections.push([target, `${target} (ไม่พบ)`])
  return (
    <div className="adm-link-fields">
      <Row label="ไปยัง section" hint={missing ? `ไม่พบ section “${target}”` : 'เลือก section หรือใส่ URL ด้านล่าง'}>
        <select value={target ?? ''} onChange={(e) => onChange({ target_section: e.target.value || null })}>
          {sections.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </Row>
      <Text
        label="ลิงก์ URL" value={link}
        placeholder="https://… หรือ /หน้าอื่น"
        hint="ใส่ URL ภายนอก เช่น https://example.com หรือ path ภายใน เช่น /contact"
        onChange={(link_url) => onChange({ link_url: link_url || null })}
      />
      <Check label="เปิดหน้าใหม่" checked={openNewTab} onChange={(open_new_tab) => onChange({ open_new_tab })} />
    </div>
  )
}

/* ───────── "เมื่อกด": ไม่เกิดอะไร / ไป section / ไป ลิงก์ / ดรอปดาวน์ ───────── */
export function ActionFields({
  action, target, link, anchors, allowDropdown, openNewTab, onNewTabChange, onChange,
}: {
  action: ClickAction
  target: string | null
  link: string | null
  anchors: string[]
  allowDropdown?: boolean
  openNewTab?: boolean
  onNewTabChange?: (v: boolean) => void
  onChange: (v: { action: ClickAction; target: string | null; link: string | null }) => void
}) {
  const opts: Opt[] = [['none', 'ไม่เกิดอะไร'], ['section', 'ไป section'], ['link', 'ไป ลิงก์']]
  if (allowDropdown) opts.push(['dropdown', 'เมนูดรอปดาวน์'])
  return (
    <>
      <Sel label="เมื่อกด" value={action} options={opts} onChange={(v) => onChange({ action: v as ClickAction, target, link })} />
      {action !== 'none' && action !== 'dropdown' && (
        <>
          <Row label="ไปยัง section" hint={anchors.length ? 'เลือก section ปลายทาง' : 'ยังไม่มี section ใน body'}>
            <select value={target ?? ''} onChange={(e) => onChange({ action, target: e.target.value || null, link })}>
              <option value="">ไม่เลือก section</option>
              {anchors.map((a) => <option key={a} value={a}>{a}</option>)}
              {target && !anchors.includes(target) && <option value={target}>{target} (ไม่พบ)</option>}
            </select>
          </Row>
          <Text label="ลิงก์ URL" value={link} placeholder="https://… หรือ /หน้าอื่น" onChange={(v) => onChange({ action, target, link: v || null })} />
          {onNewTabChange && <Check label="เปิดหน้าใหม่" checked={openNewTab ?? false} onChange={onNewTabChange} />}
        </>
      )}
    </>
  )
}

/* ───────── บันทึก ───────── */
type SaveState = { k: 'idle' | 'saving' | 'ok' | 'err'; m?: string }

export function useSaver() {
  const [st, setSt] = useState<SaveState>({ k: 'idle' })
  async function run(fn: () => Promise<ActionResult>) {
    setSt({ k: 'saving' })
    try {
      const r = await fn()
      setSt(r.ok ? { k: 'ok', m: r.error } : { k: 'err', m: r.error })
    } catch (e) {
      setSt({ k: 'err', m: e instanceof Error ? e.message : String(e) })
    }
  }
  return { st, run, reset: () => setSt({ k: 'idle' }) }
}

export function SaveBar({
  st, onSave, dirtyNote, onDraft, onTemplate,
}: {
  st: SaveState
  onSave: () => void
  dirtyNote?: string
  onDraft?: () => void
  onTemplate?: () => void
}) {
  return (
    <div className="adm-savebar">
      <button type="button" className="btn primary" disabled={st.k === 'saving'} onClick={onSave}>
        {st.k === 'saving' ? 'กำลังบันทึก…' : 'บันทึกและเผยแพร่'}
      </button>
      {onDraft && <button type="button" className="btn" disabled={st.k === 'saving'} onClick={onDraft}>บันทึกฉบับร่าง</button>}
      {onTemplate && <button type="button" className="btn" disabled={st.k === 'saving'} onClick={onTemplate}>บันทึกเป็น template</button>}
      {st.k === 'ok' && <span className={st.m ? 'adm-st-warn' : 'adm-st-ok'}>{st.m ?? 'บันทึกสำเร็จ'}</span>}
      {st.k === 'err' && <span className="adm-st-err">บันทึกไม่สำเร็จ: {st.m}</span>}
      {st.k === 'idle' && dirtyNote && <span style={{ color: 'var(--muted)' }}>{dirtyNote}</span>}
    </div>
  )
}

/* ───────── กรอบพรีวิว สลับ desk / mobile ───────── */
export function PreviewFrame({ title, children }: { title: string; children: ReactNode }) {
  const [mobile, setMobile] = useState(false)
  return (
    <div className="adm-prev">
      <div className="adm-prev-bar">
        <strong style={{ color: 'var(--text)' }}>{title}</strong>
        <span style={{ marginLeft: 'auto' }} />
        <button type="button" className={`chip${!mobile ? ' on' : ''}`} onClick={() => setMobile(false)}>desk</button>
        <button type="button" className={`chip${mobile ? ' on' : ''}`} onClick={() => setMobile(true)}>mobile</button>
      </div>
      <div className="adm-prev-body">
        <div className="site" style={{ maxWidth: mobile ? 375 : undefined }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** ปุ่มเลื่อนขึ้น/ลง/ลบ ที่ใช้ซ้ำในหลายรายการ */
export function RowTools({ onUp, onDown, onDelete }: { onUp?: () => void; onDown?: () => void; onDelete?: () => void }) {
  return (
    <>
      {onUp && <button type="button" className="btn sm" aria-label="เลื่อนขึ้น" onClick={(e) => { e.stopPropagation(); onUp() }}>↑</button>}
      {onDown && <button type="button" className="btn sm" aria-label="เลื่อนลง" onClick={(e) => { e.stopPropagation(); onDown() }}>↓</button>}
      {onDelete && <button type="button" className="btn sm danger" aria-label="ลบ" onClick={(e) => { e.stopPropagation(); onDelete() }}>ลบ</button>}
    </>
  )
}

export function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}
