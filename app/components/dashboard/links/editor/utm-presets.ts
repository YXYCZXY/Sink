export interface UtmOption {
  /** Token written into the URL query. */
  value: string
  /** Label shown in the dropdown. */
  label: string
}

export interface UtmContentPresets {
  categories: UtmOption[]
  themes: UtmOption[]
}

export interface UtmContentParts {
  category: string
  theme: string
  assetId: string
}

export interface UtmFieldPresets {
  medium: UtmOption[]
  campaign: UtmOption[]
  term: UtmOption[]
  content: UtmContentPresets
}

/** Keep a value visible when it is not part of the current preset list. */
export function ensureUtmOption(options: UtmOption[], current: string): UtmOption[] {
  const value = current.trim()
  if (!value || options.some(option => option.value === value))
    return options

  return [{ value, label: value }, ...options]
}

export function sanitizeUtmAssetId(value: string) {
  return value.replace(/[\s_]+/g, '-')
}

/**
 * Join UTM content as category_theme_assetId.
 * Empty slots keep their underscore so the three positions stay unambiguous.
 */
export function composeUtmContent(parts: UtmContentParts) {
  const category = parts.category.trim()
  const theme = parts.theme.trim()
  const assetId = sanitizeUtmAssetId(parts.assetId).replace(/^-+|-+$/g, '')

  if (!category && !theme)
    return assetId
  if (!category)
    return assetId ? `_${theme}_${assetId}` : `_${theme}`
  if (!theme && !assetId)
    return category
  if (!theme)
    return `${category}__${assetId}`
  if (!assetId)
    return `${category}_${theme}`

  return `${category}_${theme}_${assetId}`
}

export function parseUtmContent(value: string, presets?: UtmContentPresets): UtmContentParts {
  const raw = value.trim()
  if (!raw)
    return { category: '', theme: '', assetId: '' }

  if (!raw.includes('_')) {
    if (presets?.categories.some(option => option.value === raw))
      return { category: raw, theme: '', assetId: '' }
    if (presets?.themes.some(option => option.value === raw))
      return { category: '', theme: raw, assetId: '' }
    return { category: '', theme: '', assetId: raw }
  }

  const [category = '', theme = '', ...rest] = raw.split('_')
  return {
    category,
    theme,
    assetId: sanitizeUtmAssetId(rest.join('-')),
  }
}
