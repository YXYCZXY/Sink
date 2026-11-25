import type { H3Event } from 'h3'
import type { UtmCatalogSource, UtmOptionCreate, UtmOptionDelete, UtmSourceCreate } from '#shared/schemas/utm'
import { and, asc, eq, max } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { utmOptions, utmSources } from '../database/schema'

function getDatabase(event: H3Event) {
  return drizzle(event.context.cloudflare.env.DB)
}

export async function listUtmCatalog(event: H3Event): Promise<UtmCatalogSource[]> {
  const db = getDatabase(event)
  const sources = await db.select().from(utmSources).orderBy(asc(utmSources.position), asc(utmSources.value))
  const options = await db.select().from(utmOptions).orderBy(asc(utmOptions.position), asc(utmOptions.value))

  const bySource = new Map<string, UtmCatalogSource>()
  for (const source of sources) {
    bySource.set(source.value, {
      value: source.value,
      label: source.label,
      fallback: source.fallback,
      presets: {
        medium: [],
        campaign: [],
        term: [],
        content: { categories: [], themes: [] },
      },
    })
  }

  for (const option of options) {
    const entry = bySource.get(option.sourceValue)
    if (!entry)
      continue
    const item = { value: option.value, label: option.label }
    if (option.branch === 'categories' || option.branch === 'themes')
      entry.presets.content[option.branch].push(item)
    else
      entry.presets[option.branch].push(item)
  }

  return [...bySource.values()]
}

export async function createUtmSource(event: H3Event, input: UtmSourceCreate): Promise<void> {
  const db = getDatabase(event)
  const [existing] = await db.select({ value: utmSources.value }).from(utmSources).where(eq(utmSources.value, input.value)).limit(1)
  if (existing) {
    throw createError({ status: 409, statusText: 'UTM source already exists.' })
  }
  const [row] = await db.select({ position: max(utmSources.position) }).from(utmSources)
  await db.insert(utmSources).values({
    value: input.value,
    label: input.label,
    fallback: false,
    position: (row?.position ?? -1) + 1,
  })
}

export async function deleteUtmSource(event: H3Event, value: string): Promise<void> {
  const db = getDatabase(event)
  const [source] = await db.select().from(utmSources).where(eq(utmSources.value, value)).limit(1)
  if (!source) {
    throw createError({ status: 404, statusText: 'UTM source not found.' })
  }
  await db.delete(utmSources).where(eq(utmSources.value, value))
}

export async function createUtmOption(event: H3Event, input: UtmOptionCreate): Promise<void> {
  const db = getDatabase(event)
  const [source] = await db.select({ value: utmSources.value }).from(utmSources).where(eq(utmSources.value, input.source)).limit(1)
  if (!source) {
    throw createError({ status: 404, statusText: 'UTM source not found.' })
  }
  const branchCondition = and(eq(utmOptions.sourceValue, input.source), eq(utmOptions.branch, input.branch))
  const [existing] = await db.select({ value: utmOptions.value }).from(utmOptions).where(and(branchCondition, eq(utmOptions.value, input.value))).limit(1)
  if (existing) {
    throw createError({ status: 409, statusText: 'UTM option already exists.' })
  }
  const [row] = await db.select({ position: max(utmOptions.position) }).from(utmOptions).where(branchCondition)
  await db.insert(utmOptions).values({
    sourceValue: input.source,
    branch: input.branch,
    value: input.value,
    label: input.label,
    position: (row?.position ?? -1) + 1,
  })
}

export async function deleteUtmOption(event: H3Event, input: UtmOptionDelete): Promise<void> {
  const db = getDatabase(event)
  await db.delete(utmOptions).where(and(
    eq(utmOptions.sourceValue, input.source),
    eq(utmOptions.branch, input.branch),
    eq(utmOptions.value, input.value),
  ))
}
