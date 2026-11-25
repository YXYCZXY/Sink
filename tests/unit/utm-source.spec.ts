import { describe, expect, it } from 'vitest'
import { utmSourceFromLinkUrl } from '../../shared/utils/utm-source'

describe('utmSourceFromLinkUrl', () => {
  it('returns lowercase utm_source from a destination URL', () => {
    expect(utmSourceFromLinkUrl('https://example.com?utm_source=YouTube')).toBe('youtube')
  })

  it('parses utm_source alongside other query parameters', () => {
    expect(utmSourceFromLinkUrl('https://example.com/a?foo=1&utm_source=linkedin&utm_medium=post')).toBe('linkedin')
  })

  it('trims whitespace around the value', () => {
    expect(utmSourceFromLinkUrl('https://example.com?utm_source=%20twitter%20')).toBe('twitter')
  })

  it('returns undefined when utm_source is missing or empty', () => {
    expect(utmSourceFromLinkUrl('https://example.com')).toBeUndefined()
    expect(utmSourceFromLinkUrl('https://example.com?utm_source=')).toBeUndefined()
    expect(utmSourceFromLinkUrl('https://example.com?utm_source=%20%20')).toBeUndefined()
  })
})