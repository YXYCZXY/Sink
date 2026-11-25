import type { UtmCatalogSource } from '#shared/schemas/utm'
import type { UtmFieldPresets, UtmOption } from '@/components/dashboard/links/editor/utm-presets'

export type UtmBranchKey = 'medium' | 'campaign' | 'term' | 'categories' | 'themes'

export const utmTokenPattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/

export function normalizeUtmToken(value: string) {
  return value.trim().toLowerCase()
}

export function isDuplicateUtmToken(existingValues: string[], value: string) {
  return existingValues.includes(normalizeUtmToken(value))
}

export interface UtmSourceEntry {
  value: string
  label: string
  fallback?: boolean
  presets: UtmFieldPresets
}

function emptyPresets(): UtmFieldPresets {
  return {
    medium: [],
    campaign: [],
    term: [],
    content: { categories: [], themes: [] },
  }
}

function toEntry(source: UtmCatalogSource): UtmSourceEntry {
  return {
    value: source.value,
    label: source.label,
    fallback: source.fallback || undefined,
    presets: source.presets,
  }
}

export function useUtmCatalog() {
  const sources = useState<UtmSourceEntry[]>('utm-catalog', () => [])
  const loaded = useState('utm-catalog-loaded', () => false)
  const refreshing = useState('utm-catalog-refreshing', () => false)

  async function refresh() {
    if (refreshing.value)
      return
    refreshing.value = true
    try {
      const catalog = await useAPI<UtmCatalogSource[]>('/api/utm')
      sources.value = catalog.map(toEntry)
    }
    finally {
      refreshing.value = false
      loaded.value = true
    }
  }

  function sourceValues() {
    return sources.value.map(source => source.value)
  }

  function branchOptions(sourceValue: string, branch: UtmBranchKey): UtmOption[] {
    const source = sources.value.find(entry => entry.value === sourceValue)
    if (!source)
      return []
    return branch === 'categories' || branch === 'themes'
      ? source.presets.content[branch]
      : source.presets[branch]
  }

  /** Branch presets for the link editor: the matching source, else the fallback source. */
  function fieldPresets(sourceValue: string): UtmFieldPresets {
    const normalized = normalizeUtmToken(sourceValue)
    const source = sources.value.find(entry => entry.value === normalized)
      ?? sources.value.find(entry => entry.fallback)
    return source?.presets ?? emptyPresets()
  }

  async function addSource(entry: { value: string, label: string }) {
    if (sourceValues().includes(entry.value))
      return false
    await useAPI('/api/utm/source', { method: 'POST', body: entry })
    sources.value = [...sources.value, { value: entry.value, label: entry.label, presets: emptyPresets() }]
    return true
  }

  async function removeSource(value: string) {
    const index = sources.value.findIndex(entry => entry.value === value)
    const entry = sources.value[index]
    if (!entry || entry.fallback)
      return -1
    await useAPI('/api/utm/source/delete', { method: 'POST', body: { value } })
    sources.value.splice(index, 1)
    return index
  }

  async function addOption(sourceValue: string, branch: UtmBranchKey, option: UtmOption) {
    const options = branchOptions(sourceValue, branch)
    if (options.some(entry => entry.value === option.value))
      return false
    await useAPI('/api/utm/option', { method: 'POST', body: { source: sourceValue, branch, ...option } })
    options.push({ ...option })
    return true
  }

  async function removeOption(sourceValue: string, branch: UtmBranchKey, optionValue: string) {
    const options = branchOptions(sourceValue, branch)
    const index = options.findIndex(entry => entry.value === optionValue)
    if (index === -1)
      return
    await useAPI('/api/utm/option/delete', { method: 'POST', body: { source: sourceValue, branch, value: optionValue } })
    options.splice(index, 1)
  }

  return {
    sources,
    loaded,
    refresh,
    sourceValues,
    branchOptions,
    fieldPresets,
    addSource,
    removeSource,
    addOption,
    removeOption,
  }
}
