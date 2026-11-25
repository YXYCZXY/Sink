import type { UtmCatalogSource } from '../../shared/schemas/utm'
import { afterEach, describe, expect, it } from 'vitest'
import { fetch, fetchWithAuth, postJson } from '../utils'

const createdSources = new Set<string>()

function trackSource(value: string) {
  createdSources.add(value)
  return value
}

async function getCatalog(): Promise<UtmCatalogSource[]> {
  const response = await fetchWithAuth('/api/utm')
  expect(response.status).toBe(200)
  return await response.json() as UtmCatalogSource[]
}

afterEach(async () => {
  for (const value of createdSources)
    await postJson('/api/utm/source/delete', { value })
  createdSources.clear()
})

describe('/api/utm', () => {
  it('requires authentication', async () => {
    const response = await fetch('/api/utm')
    expect(response.status).toBe(401)
  })

  it('returns the seeded catalog', async () => {
    const catalog = await getCatalog()
    const fallback = catalog.find(source => source.fallback)
    expect(fallback).toBeDefined()
    expect(fallback?.value).toBe('')
    expect(fallback?.presets.medium.length).toBeGreaterThan(0)

    const youtube = catalog.find(source => source.value === 'youtube')
    expect(youtube?.label).toBe('YouTube')
    expect(youtube?.presets.medium.map(option => option.value)).toContain('video')
    expect(youtube?.presets.content.categories.map(option => option.value)).toContain('shorts')

    const blog = catalog.find(source => source.value === 'blog')
    expect(blog?.presets.campaign.map(option => option.value)).toContain('series')
  })

  it('creates and deletes a source', async () => {
    const value = trackSource(`test-${crypto.randomUUID().slice(0, 8)}`)
    const created = await postJson('/api/utm/source', { value, label: 'Test Source' })
    expect(created.status).toBe(201)

    const catalog = await getCatalog()
    const entry = catalog.find(source => source.value === value)
    expect(entry?.label).toBe('Test Source')
    expect(entry?.fallback).toBe(false)
    expect(entry?.presets.medium).toEqual([])

    const duplicate = await postJson('/api/utm/source', { value, label: 'Test Source' })
    expect(duplicate.status).toBe(409)

    const deleted = await postJson('/api/utm/source/delete', { value })
    expect(deleted.status).toBe(200)
    createdSources.delete(value)

    const afterDelete = await getCatalog()
    expect(afterDelete.some(source => source.value === value)).toBe(false)
  })

  it('rejects invalid source tokens', async () => {
    const response = await postJson('/api/utm/source', { value: 'Bad Token!', label: 'Bad' })
    expect(response.status).toBe(400)
  })

  it('protects the fallback source from deletion', async () => {
    const response = await postJson('/api/utm/source/delete', { value: '' })
    expect(response.status).toBe(400)
  })

  it('returns 404 when deleting an unknown source', async () => {
    const response = await postJson('/api/utm/source/delete', { value: 'missing-source' })
    expect(response.status).toBe(404)
  })

  it('adds and removes branch options', async () => {
    const value = trackSource(`test-${crypto.randomUUID().slice(0, 8)}`)
    await postJson('/api/utm/source', { value, label: 'Test Source' })

    const created = await postJson('/api/utm/option', { source: value, branch: 'medium', value: 'email', label: 'Email' })
    expect(created.status).toBe(201)

    let catalog = await getCatalog()
    let entry = catalog.find(source => source.value === value)
    expect(entry?.presets.medium).toEqual([{ value: 'email', label: 'Email' }])

    const duplicate = await postJson('/api/utm/option', { source: value, branch: 'medium', value: 'email', label: 'Email' })
    expect(duplicate.status).toBe(409)

    const deleted = await postJson('/api/utm/option/delete', { source: value, branch: 'medium', value: 'email' })
    expect(deleted.status).toBe(200)

    catalog = await getCatalog()
    entry = catalog.find(source => source.value === value)
    expect(entry?.presets.medium).toEqual([])
  })

  it('returns 404 when adding an option to an unknown source', async () => {
    const response = await postJson('/api/utm/option', { source: 'missing-source', branch: 'medium', value: 'email', label: 'Email' })
    expect(response.status).toBe(404)
  })

  it('rejects unknown branches', async () => {
    const response = await postJson('/api/utm/option', { source: 'youtube', branch: 'banner', value: 'email', label: 'Email' })
    expect(response.status).toBe(400)
  })

  it('allows options on the fallback source', async () => {
    const value = `test-${crypto.randomUUID().slice(0, 8)}`
    const created = await postJson('/api/utm/option', { source: '', branch: 'term', value, label: 'Temp' })
    expect(created.status).toBe(201)

    const deleted = await postJson('/api/utm/option/delete', { source: '', branch: 'term', value })
    expect(deleted.status).toBe(200)
  })
})
