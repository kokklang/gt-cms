import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BodyCard, BodyImage, BodySectionRow, FooterColumnRow, FooterConfig, FooterContact,
  FooterLink, HeaderConfig, NavChild, NavItemRow, SectionKind, SiteContent,
} from './types'

async function all<T>(sb: SupabaseClient, table: string, order?: string): Promise<T[]> {
  let q = sb.from(table).select('*')
  if (order) q = q.order(order, { ascending: true })
  const { data, error } = await q
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}

/** โหลดเนื้อหาทั้งหน้า (header/body/footer) แล้วประกอบเป็นโครงซ้อนกัน */
export async function loadContent(sb: SupabaseClient): Promise<SiteContent> {
  const [secs, hc, ni, nc, bs, bcards, bimgs, fc, fcols, fl, fct] = await Promise.all([
    all<{ id: string; kind: SectionKind }>(sb, 'site_sections'),
    all<HeaderConfig>(sb, 'header_config'),
    all<NavItemRow>(sb, 'header_nav_items', 'sort_order'),
    all<NavChild>(sb, 'header_nav_children', 'sort_order'),
    all<BodySectionRow>(sb, 'body_sections', 'sort_order'),
    all<BodyCard>(sb, 'body_cards', 'sort_order'),
    all<BodyImage>(sb, 'body_gallery_images', 'sort_order'),
    all<FooterConfig>(sb, 'footer_config'),
    all<FooterColumnRow>(sb, 'footer_columns', 'position'),
    all<FooterLink>(sb, 'footer_links', 'sort_order'),
    all<FooterContact>(sb, 'footer_contacts'),
  ])

  const sectionIds: Record<SectionKind, string> = { header: '', body: '', footer: '' }
  secs.forEach((s) => { sectionIds[s.kind] = s.id })

  const hcfg = hc.find((x) => x.section_id === sectionIds.header) ?? null
  const header = hcfg
    ? {
        config: hcfg,
        items: ni
          .filter((i) => i.header_id === hcfg.id)
          .map((i) => ({ ...i, children: nc.filter((c) => c.nav_item_id === i.id) })),
      }
    : null

  const body = bs
    .filter((s) => s.section_id === sectionIds.body)
    .map((s) => ({
      ...s,
      cards: bcards.filter((c) => c.body_section_id === s.id),
      gallery: bimgs.filter((g) => g.body_section_id === s.id),
    }))

  const fcfg = fc.find((x) => x.section_id === sectionIds.footer) ?? null
  const footer = fcfg
    ? {
        config: fcfg,
        columns: fcols
          .filter((c) => c.footer_id === fcfg.id)
          .map((c) => ({
            ...c,
            links: fl.filter((l) => l.column_id === c.id),
            contacts: fct.filter((x) => x.column_id === c.id),
          })),
      }
    : null

  return { sectionIds, header, body, footer }
}
