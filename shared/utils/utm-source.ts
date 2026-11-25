import { parseQuery, parseURL } from 'ufo'

function queryParamValue(value: string | string[] | undefined | null): string | undefined {
  if (typeof value === 'string')
    return value
  if (Array.isArray(value))
    return value[0]
  return undefined
}

/** Lowercase utm_source from a destination URL, if present. */
export function utmSourceFromLinkUrl(url: string): string | undefined {
  const value = queryParamValue(parseQuery(parseURL(url).search)['utm_source'])
  if (typeof value !== 'string' || !value.trim())
    return undefined
  return value.trim().toLowerCase()
}