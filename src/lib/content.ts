import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BodyCard, BodyImage, BodyPayload, BodySection, BodySectionRow, FooterColumnRow, FooterConfig,
  FooterContact, FooterLink, FooterPayload, HeaderConfig, HeaderPayload, NavChild, NavItemRow,
  SectionKind, SiteContent,
} from './types'

function omit<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  const result = { ...value }
  keys.forEach((key) => Reflect.deleteProperty(result, key))
  return result as Omit<T, K>
}

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

export function contentToPayloads(content: SiteContent) {
  const header: HeaderPayload | null = content.header
    ? {
        config: content.header.config,
        items: content.header.items.map((item) => omit(item, 'children')),
        children: content.header.items.flatMap((item) => item.children),
      }
    : null

  const body: BodyPayload = {
    section_id: content.sectionIds.body,
    sections: content.body.map((section, i) => ({
      ...omit(section, 'cards', 'gallery'),
      section_id: content.sectionIds.body,
      sort_order: i + 1,
    })),
    cards: content.body.flatMap((section) =>
      section.cards.map((card, i) => ({ ...card, sort_order: i + 1 })),
    ),
    images: content.body.flatMap((section) =>
      section.gallery.map((image, i) => ({ ...image, sort_order: i + 1 })),
    ),
  }

  const footer: FooterPayload | null = content.footer
    ? {
        config: content.footer.config,
        columns: content.footer.columns.map((column, i) => ({
          ...omit(column, 'links', 'contacts'),
          position: i + 1,
        })),
        links: content.footer.columns.flatMap((column) =>
          column.links.map((link, i) => ({ ...link, sort_order: i + 1 })),
        ),
        contacts: content.footer.columns.flatMap((column) => column.contacts),
      }
    : null

  return { sectionIds: content.sectionIds, header, body, footer }
}

export function toBodyPayload(sectionId: string, sections: BodySection[]): BodyPayload {
  return {
    section_id: sectionId,
    sections: sections.map((section, i) => ({
      ...omit(section, 'cards', 'gallery'),
      section_id: sectionId,
      sort_order: i + 1,
    })),
    cards: sections.flatMap((section) =>
      section.cards.map((card, i) => ({ ...card, sort_order: i + 1 })),
    ),
    images: sections.flatMap((section) =>
      section.gallery.map((image, i) => ({ ...image, sort_order: i + 1 })),
    ),
  }
}
