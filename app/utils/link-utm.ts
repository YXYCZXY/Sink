import { utmSourceFromLinkUrl } from '#shared/utils/utm-source'

export { utmSourceFromLinkUrl }

export function linkMatchesUtmSource(url: string, utmSource: string | undefined): boolean {
  if (!utmSource)
    return true
  return utmSourceFromLinkUrl(url) === utmSource.toLowerCase()
}