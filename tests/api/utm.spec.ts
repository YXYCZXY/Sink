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

  it('returns an empty catalog by default', async () => {
    const catalog = await getCatalog()
    expect(catalog).toEqual([])
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
    const value = trackSource(`test-${crypto.randomUUID().slice(0, 8)}`)
    await postJson('/api/utm/source', { value, label: 'Test Source' })

    const response = await postJson('/api/utm/option', { source: value, branch: 'banner', value: 'email', label: 'Email' })
    expect(response.status).toBe(400)
  })
})