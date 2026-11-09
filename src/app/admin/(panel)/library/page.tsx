import { LibraryManager } from '@/components/admin/LibraryManager'
import { loadLibraryItems } from '@/lib/library'

export default async function LibraryPage() {
  const { items, error } = await loadLibraryItems()
  return <LibraryManager initialItems={items} loadError={error} />
}
