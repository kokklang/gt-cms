'use client'
import { useState } from 'react'
import type {
  BodyCard, BodyImage, BodyPayload, BodySection, BodyTemplate,
} from '@/lib/types'
import { newBodySection, newCard, uid } from '@/lib/defaults'
import { TEMPLATES, tplOf } from '@/lib/meta'
import { saveBody } from '@/app/admin/actions'
import { SiteBody } from '@/components/site/SiteBody'
import {
  Btn, Card, Check, Color, ImageField, PreviewFrame, Row, RowTools, SaveBar, Sel, Text,
  move, uploadImage, useSaver, type Opt,
} from './ui'

const MAX_CARDS = 6
const MAX_IMAGES = 6
const SIZES: Opt[] = [['s', 'เล็ก'], ['m', 'กลาง'], ['l', 'ใหญ่']]
const ALIGNS: Opt[] = [['left', 'ชิดซ้าย'], ['center', 'กึ่งกลาง'], ['right', 'ชิดขวา']]
const RADII: Opt[] = [['0', 'เหลี่ยม'], ['6', 'มนเล็กน้อย'], ['20', 'แคปซูล']]
const ANCHOR_RE = /^[a-zA-Z0-9-]+$/

function defaultAlign(t: BodyTemplate): BodySection['text_align'] {
  return t === 'hero-l' || tplOf(t).type === 'textimg' ? 'left' : 'center'
}

export function BodyEditor({
  sectionId, initial, saved,
}: {
  sectionId: string
  initial: BodySection[]
  saved: boolean
}) {
  const [secs, setSecs] = useState<BodySection[]>(initial)
  const [sel, setSel] = useState(0)
  const [showTpl, setShowTpl] = useState(false)
  const [allCard, setAllCard] = useState({
    bg_color: '#FFFFFF', border_color: '#D3D1C7', title_color: '#141414', desc_color: '#5F5E5A',
  })
  const [uploading, setUploading] = useState(false)
  const [upErr, setUpErr] = useState('')
  const { st, run } = useSaver()

  const s = secs[sel] ?? null
  const type = s ? tplOf(s.template).type : null
  const anchors = secs.map((x) => x.anchor_name)

  const patch = (i: number, p: Partial<BodySection>) =>
    setSecs((a) => a.map((x, k) => (k === i ? { ...x, ...p } : x)))

  function add(t: BodyTemplate) {
    setSecs((a) => [...a, newBodySection(sectionId, t, a.length + 1, a.map((x) => x.anchor_name))])
    setSel(secs.length)
    setShowTpl(false)
  }
  function remove(i: number) {
    setSecs((a) => a.filter((_, k) => k !== i))
    setSel((v) => Math.max(0, Math.min(v, secs.length - 2)))
  }
  function moveSec(i: number, d: -1 | 1) {
    setSecs((a) => move(a, i, d))
    setSel((v) => (v === i ? i + d : v === i + d ? i : v))
  }
  function setTemplate(t: BodyTemplate) {
    if (!s) return
    const p: Partial<BodySection> = { template: t, text_align: defaultAlign(t) }
    if (tplOf(t).type === 'cards' && s.cards.length === 0) {
      p.cards = [newCard(s.id, 1), newCard(s.id, 2), newCard(s.id, 3)]
    }
    patch(sel, p)
  }

  function patchCard(j: number, p: Partial<BodyCard>) {
    if (!s) return
    patch(sel, { cards: s.cards.map((c, m) => (m === j ? { ...c, ...p } : c)) })
  }
  function patchImage(j: number, p: Partial<BodyImage>) {
    if (!s) return
    patch(sel, { gallery: s.gallery.map((g, m) => (m === j ? { ...g, ...p } : g)) })
  }
  async function addImages(files: FileList | null) {
    if (!files || !s) return
    const secId = s.id
    const list = Array.from(files).slice(0, MAX_IMAGES - s.gallery.length)
    if (list.length === 0) return
    setUploading(true)
    setUpErr('')
    const added: BodyImage[] = []
    for (const f of list) {
      try {
        const url = await uploadImage(f, 'body')
        added.push({ id: uid(), body_section_id: secId, sort_order: 0, image_url: url, link_url: null })
      } catch (e) {
        setUpErr(e instanceof Error ? e.message : String(e))
      }
    }
    setSecs((a) => a.map((x) => (x.id === secId ? { ...x, gallery: [...x.gallery, ...added] } : x)))
    setUploading(false)
  }

  const dupAnchor = s ? anchors.filter((a) => a === s.anchor_name).length > 1 : false

  function onSave() {
    for (const x of secs) {
      if (!ANCHOR_RE.test(x.anchor_name)) {
        run(async () => ({ ok: false, error: 'ชื่อ section ต้องเป็นภาษาอังกฤษ/ตัวเลข/ขีดกลาง และห้ามว่าง' }))
        return
      }
    }
    if (new Set(anchors).size !== anchors.length) {
      run(async () => ({ ok: false, error: 'ชื่อ section ซ้ำกัน ต้องไม่ซ้ำในหน้าเดียวกัน' }))
      return
    }
    const payload: BodyPayload = {
      section_id: sectionId,
      sections: secs.map(({ cards: _c, gallery: _g, ...row }, i) => ({
        ...row, section_id: sectionId, sort_order: i + 1,
      })),
      cards: secs.flatMap((x) =>
        tplOf(x.template).type === 'cards'
          ? x.cards.slice(0, MAX_CARDS).map((c, j) => ({ ...c, body_section_id: x.id, sort_order: j + 1 }))
          : [],
      ),
      images: secs.flatMap((x) =>
        tplOf(x.template).type === 'gallery'
          ? x.gallery.slice(0, MAX_IMAGES).map((g, j) => ({ ...g, body_section_id: x.id, sort_order: j + 1 }))
          : [],
      ),
    }
    run(() => saveBody(payload))
  }

  return (
    <>
      <h1>body</h1>
      <p className="adm-sub">เรียงลำดับ เพิ่ม ลบ section ได้ และเลือก template ตอนเพิ่ม</p>
      {!saved && <div className="adm-notice">ยังไม่เคยบันทึก: กำลังแสดงค่าตัวอย่าง กด “บันทึกและเผยแพร่” เพื่อใช้จริง</div>}

      <div className="adm-grid">
        <div className="adm-ctrls">
          <Card title={`รายการ section (${secs.length})`}>
            {secs.length === 0 && <p style={{ color: 'var(--muted)', margin: '0 0 10px' }}>ยังไม่มี section กด “เพิ่ม section”</p>}
            {secs.map((x, i) => (
              <div key={x.id} className={`adm-li${i === sel ? ' on' : ''}`} onClick={() => setSel(i)}>
                <span className="n">
                  {i + 1}. {x.anchor_name || '(ไม่มีชื่อ)'}
                  <small>{tplOf(x.template).name}</small>
                </span>
                <RowTools
                  onUp={i > 0 ? () => moveSec(i, -1) : undefined}
                  onDown={i < secs.length - 1 ? () => moveSec(i, 1) : undefined}
                  onDelete={() => remove(i)}
                />
              </div>
            ))}
            <Btn sm onClick={() => setShowTpl((v) => !v)}>+ เพิ่ม section</Btn>
            {showTpl && (
              <div className="adm-tpls">
                {TEMPLATES.map((t) => (
                  <button key={t.key} type="button" className="adm-tpl" onClick={() => add(t.key)}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {s && type && (
            <Card title={`แก้ไข section ที่ ${sel + 1}`}>
              <Sel label="template" value={s.template} options={TEMPLATES.map((t): Opt => [t.key, t.name])} onChange={(v) => setTemplate(v as BodyTemplate)} />
              <Text
                label="ชื่อ section" value={s.anchor_name}
                hint="ภาษาอังกฤษ/ตัวเลข/ขีดกลาง ใช้เป็นปลายทางของปุ่ม “ไป section” ใน header"
                onChange={(v) => patch(sel, { anchor_name: v.replace(/[^a-zA-Z0-9-]/g, '') })}
              />
              {dupAnchor && <p className="adm-warn" style={{ margin: '-4px 0 10px' }}>ชื่อนี้ซ้ำกับ section อื่น</p>}
              <Color label="สีพื้น section" value={s.bg_color} onChange={(bg_color) => patch(sel, { bg_color })} />
              <Sel label="การจัดวาง" value={s.text_align} options={ALIGNS} onChange={(v) => patch(sel, { text_align: v as BodySection['text_align'] })} />

              <hr className="adm-sep" />
              <p className="adm-subh">หัวข้อ</p>
              <Check label="แสดงหัวข้อ" checked={s.show_title} onChange={(show_title) => patch(sel, { show_title })} />
              {s.show_title && (
                <>
                  <Text label="ข้อความ" value={s.title} onChange={(v) => patch(sel, { title: v })} />
                  <Color label="สีหัวข้อ" value={s.title_color} onChange={(title_color) => patch(sel, { title_color })} />
                  <Sel label="ขนาด" value={s.title_size} options={SIZES} onChange={(v) => patch(sel, { title_size: v as BodySection['title_size'] })} />
                  <Text label="ลิงก์หัวข้อ" value={s.title_url} placeholder="https://… หรือ #ชื่อ-section (ไม่ใส่ก็ได้)" onChange={(v) => patch(sel, { title_url: v || null })} />
                </>
              )}

              {type !== 'cards' && type !== 'gallery' && (
                <>
                  <hr className="adm-sep" />
                  <p className="adm-subh">ข้อความ</p>
                  <Check label="แสดงข้อความ" checked={s.show_body} onChange={(show_body) => patch(sel, { show_body })} />
                  {s.show_body && (
                    <>
                      <Text label="ข้อความ" area value={s.body_text} onChange={(v) => patch(sel, { body_text: v })} />
                      <Color label="สีข้อความ" value={s.body_color} onChange={(body_color) => patch(sel, { body_color })} />
                      <Text label="ลิงก์ข้อความ" value={s.body_url} placeholder="https://… (ไม่ใส่ก็ได้)" onChange={(v) => patch(sel, { body_url: v || null })} />
                    </>
                  )}
                </>
              )}

              {(type === 'hero' || type === 'textimg') && (
                <>
                  <hr className="adm-sep" />
                  <p className="adm-subh">{type === 'hero' ? 'รูปพื้นหลัง' : 'รูปภาพ'}</p>
                  <ImageField
                    label={type === 'hero' ? 'รูปพื้นหลัง' : 'รูปภาพ'} value={s.image_url} folder="body"
                    hint={type === 'hero' ? 'แนะนำ 1920×800 px' : 'แนะนำ 800×600 px'}
                    onChange={(image_url) => patch(sel, { image_url })}
                  />
                  {type === 'textimg' && (
                    <Text label="ลิงก์รูป" value={s.image_link_url} placeholder="https://… (ไม่ใส่ก็ได้)" onChange={(v) => patch(sel, { image_link_url: v || null })} />
                  )}
                </>
              )}

              {type === 'cards' && (
                <>
                  <hr className="adm-sep" />
                  <p className="adm-subh">การ์ด ({s.cards.length}/{MAX_CARDS})</p>
                  <div className="adm-box">
                    <p className="adm-subh">สีทั้งหมด</p>
                    <Color label="พื้น" value={allCard.bg_color} onChange={(bg_color) => setAllCard((a) => ({ ...a, bg_color }))} />
                    <Color label="ขอบ" value={allCard.border_color} onChange={(border_color) => setAllCard((a) => ({ ...a, border_color }))} />
                    <Color label="หัวข้อ" value={allCard.title_color} onChange={(title_color) => setAllCard((a) => ({ ...a, title_color }))} />
                    <Color label="ข้อความ" value={allCard.desc_color} onChange={(desc_color) => setAllCard((a) => ({ ...a, desc_color }))} />
                    <Btn sm onClick={() => patch(sel, { cards: s.cards.map((c) => ({ ...c, ...allCard })) })}>ใช้กับทุกการ์ด</Btn>
                  </div>
                  {s.cards.map((c, j) => (
                    <div className="adm-box" key={c.id}>
                      <Text label="หัวข้อ" value={c.title} onChange={(title) => patchCard(j, { title })} />
                      <Text label="ข้อความ" value={c.description} onChange={(description) => patchCard(j, { description })} />
                      <Text label="ลิงก์" value={c.link_url} placeholder="https://… (ไม่ใส่ก็ได้)" onChange={(v) => patchCard(j, { link_url: v || null })} />
                      <Color label="สีพื้น" value={c.bg_color} onChange={(bg_color) => patchCard(j, { bg_color })} />
                      <Color label="สีขอบ" value={c.border_color} onChange={(border_color) => patchCard(j, { border_color })} />
                      <Color label="สีหัวข้อ" value={c.title_color} onChange={(title_color) => patchCard(j, { title_color })} />
                      <Color label="สีข้อความ" value={c.desc_color} onChange={(desc_color) => patchCard(j, { desc_color })} />
                      <div className="adm-actions" style={{ marginBottom: 0 }}>
                        <RowTools
                          onUp={j > 0 ? () => patch(sel, { cards: move(s.cards, j, -1) }) : undefined}
                          onDown={j < s.cards.length - 1 ? () => patch(sel, { cards: move(s.cards, j, 1) }) : undefined}
                          onDelete={() => patch(sel, { cards: s.cards.filter((_, m) => m !== j) })}
                        />
                      </div>
                    </div>
                  ))}
                  <Btn sm disabled={s.cards.length >= MAX_CARDS} onClick={() => patch(sel, { cards: [...s.cards, newCard(s.id, s.cards.length + 1)] })}>+ เพิ่มการ์ด</Btn>
                </>
              )}

              {type === 'gallery' && (
                <>
                  <hr className="adm-sep" />
                  <p className="adm-subh">รูป ({s.gallery.length}/{MAX_IMAGES}) · แนะนำ 800×600 px</p>
                  <Row>
                    <label className="btn sm">
                      <input
                        type="file" accept="image/*" multiple hidden
                        disabled={uploading || s.gallery.length >= MAX_IMAGES}
                        onChange={(e) => { const f = e.target.files; e.target.value = ''; addImages(f) }}
                      />
                      {uploading ? 'กำลังอัปโหลด…' : 'เพิ่มรูป'}
                    </label>
                    {upErr && <small className="adm-warn">{upErr}</small>}
                  </Row>
                  {s.gallery.map((g, j) => (
                    <div className="adm-box" key={g.id}>
                      <Row>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="adm-thumb" src={g.image_url} alt="" />
                        <input type="text" value={g.link_url ?? ''} placeholder="ลิงก์รูป (ไม่ใส่ก็ได้)" onChange={(e) => patchImage(j, { link_url: e.target.value || null })} />
                      </Row>
                      <div className="adm-actions" style={{ marginBottom: 0 }}>
                        <RowTools
                          onUp={j > 0 ? () => patch(sel, { gallery: move(s.gallery, j, -1) }) : undefined}
                          onDown={j < s.gallery.length - 1 ? () => patch(sel, { gallery: move(s.gallery, j, 1) }) : undefined}
                          onDelete={() => patch(sel, { gallery: s.gallery.filter((_, m) => m !== j) })}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {(type === 'hero' || type === 'textimg' || type === 'cta' || type === 'text') && (
                <>
                  <hr className="adm-sep" />
                  <p className="adm-subh">ปุ่ม</p>
                  <Check label="มีปุ่มกด" checked={s.btn_enabled} onChange={(btn_enabled) => patch(sel, { btn_enabled })} />
                  {s.btn_enabled && (
                    <>
                      <Text label="ข้อความปุ่ม" value={s.btn_label} onChange={(v) => patch(sel, { btn_label: v })} />
                      <Color label="สีปุ่ม" value={s.btn_bg_color} onChange={(btn_bg_color) => patch(sel, { btn_bg_color })} />
                      <Color label="สีข้อความปุ่ม" value={s.btn_text_color} onChange={(btn_text_color) => patch(sel, { btn_text_color })} />
                      <Sel label="รูปทรงปุ่ม" value={String(s.btn_radius)} options={RADII} onChange={(v) => patch(sel, { btn_radius: Number(v) })} />
                      <Text label="ลิงก์ปุ่ม" value={s.btn_url} placeholder="https://… หรือ #ชื่อ-section" onChange={(v) => patch(sel, { btn_url: v || null })} />
                    </>
                  )}
                </>
              )}
            </Card>
          )}
        </div>

        <PreviewFrame title="พรีวิว body">
          {secs.length ? (
            <SiteBody sections={secs} selectedId={s?.id} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: '#8f8d87' }}>ยังไม่มี section</div>
          )}
        </PreviewFrame>
      </div>

      <SaveBar st={st} onSave={onSave} dirtyNote="ยังไม่ได้บันทึกการเปลี่ยนแปลง" />
    </>
  )
}
