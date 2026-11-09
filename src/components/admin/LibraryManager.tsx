'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  applyBuiltinPageTemplate, deleteLibraryItem, publishLibraryItem, saveCurrentPageItem,
} from '@/app/admin/actions'
import type { LibraryItemSummary } from '@/lib/types'
import { TEMPLATES, tplOf } from '@/lib/meta'

const KIND_LABEL = { version: 'เวอร์ชัน', draft: 'ฉบับร่าง', template: 'Template' } as const
const SCOPE_LABEL = {
  page: 'ทั้งหน้าเว็บ', header: 'Header', body: 'Body', footer: 'Footer', section: 'Section',
} as const

export function LibraryManager({
  initialItems, loadError,
}: {
  initialItems: LibraryItemSummary[]
  loadError: string | null
}) {
  const items = initialItems
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()


  async function run(task: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = await task()
      if (!result.ok) {
        setError(result.error ?? 'ดำเนินการไม่สำเร็จ')
      } else {
        setMessage(result.error ?? 'ดำเนินการสำเร็จ')
        router.refresh()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveCurrent(kind: 'draft' | 'template') {
    const label = window.prompt(kind === 'draft' ? 'ตั้งชื่อฉบับร่างของหน้าเว็บ' : 'ตั้งชื่อ template หน้าเว็บ')
    if (!label?.trim()) return
    await run(() => saveCurrentPageItem(kind, label))
  }

  async function restore(item: LibraryItemSummary) {
    const action = item.kind === 'version' ? 'กู้คืนเวอร์ชัน' : 'นำไปใช้'
    if (!window.confirm(`${action} “${item.label}” ในส่วน ${SCOPE_LABEL[item.scope]}? ข้อมูลปัจจุบันจะถูกเก็บเป็นเวอร์ชันก่อนดำเนินการ`)) return
    await run(() => publishLibraryItem(item.id))
  }

  async function remove(item: LibraryItemSummary) {
    if (!window.confirm(`ลบ ${KIND_LABEL[item.kind]} “${item.label}” หรือไม่?`)) return
    const result = await deleteLibraryItem(item.id)
    if (!result.ok) {
      setError(result.error ?? 'ลบไม่สำเร็จ')
      return
    }
    router.refresh()
  }

  const groups = (['version', 'draft', 'template'] as const).map((kind) => ({
    kind,
    entries: items.filter((item) => item.kind === kind),
  }))

  return (
    <>
      <h1>เวอร์ชัน · ฉบับร่าง · Template</h1>
      <p className="adm-sub">บันทึกฉบับร่างและ template จากหน้าที่กำลังแก้ ดูประวัติ และกู้คืนได้จากที่เดียว</p>
      {loadError && <div className="adm-warn">โหลดรายการไม่สำเร็จ: {loadError}</div>}
      {message && <div className="adm-notice">{message}</div>}
      {error && <div className="adm-warn">{error}</div>}

      <section className="adm-card adm-library-start">
        <h2>เริ่มต้นจาก template ระบบ</h2>
        <p>ใช้หน้าเว็บตัวอย่าง GT7 เป็นจุดเริ่มต้น ระบบจะเก็บหน้าเดิมเป็นเวอร์ชันก่อนแทนที่</p>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => {
            if (window.confirm('แทนที่ Header, Body และ Footer ปัจจุบันด้วย template ตัวอย่าง? ระบบจะบันทึกหน้าเดิมเป็นเวอร์ชันก่อน')) {
              void run(applyBuiltinPageTemplate)
            }
          }}
        >
          ใช้ template หน้าเว็บตัวอย่าง
        </button>
        <div className="adm-library-builtins">
          <strong>Template section ที่มีใน Body</strong>
          <div className="chips">
            {TEMPLATES.map((template) => (
              <span className="chip" key={template.key}>{tplOf(template.key).name}</span>
            ))}
          </div>
          <a className="btn sm" href="/admin/body">เพิ่มหรือจัดการ template section</a>
        </div>
      </section>

      <section className="adm-card">
        <h2>บันทึกหน้าเว็บปัจจุบัน</h2>
        <p className="adm-sub">ฉบับร่างและ template จะเก็บสำเนา Header, Body และ Footer ปัจจุบัน</p>
        <div className="adm-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => void saveCurrent('draft')}>
            บันทึกฉบับร่าง
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void saveCurrent('template')}>
            บันทึกเป็น template
          </button>
        </div>
      </section>

      {groups.map(({ kind, entries }) => (
        <section className="adm-card" key={kind}>
          <h2>{KIND_LABEL[kind]} ({entries.length})</h2>
          {entries.length === 0 ? (
            <p className="adm-sub">ยังไม่มีรายการ</p>
          ) : (
            <div className="adm-library-list">
              {entries.map((item) => (
                <article className="adm-library-item" key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{SCOPE_LABEL[item.scope]} · {new Date(item.created_at).toLocaleString('th-TH')}</small>
                  </div>
                  <div className="adm-actions">
                    <button type="button" className="btn sm primary" disabled={busy} onClick={() => void restore(item)}>
                      {kind === 'version' ? 'กู้คืน' : item.scope === 'section' ? 'เพิ่ม section' : 'นำไปใช้'}
                    </button>
                    {kind !== 'version' && (
                      <button type="button" className="btn sm danger" disabled={busy} onClick={() => void remove(item)}>
                        ลบ
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </>
  )
}
