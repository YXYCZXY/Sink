import { z } from 'zod'

export const utmBranches = ['medium', 'campaign', 'term', 'categories', 'themes'] as const
export type UtmBranch = (typeof utmBranches)[number]

export const UtmTokenSchema = z.preprocess(
  value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.string().min(1).max(64).regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, 'invalid UTM token'),
)

/** The fallback source keeps an empty value, so option payloads must allow it. */
const UtmSourceValueSchema = z.union([z.literal(''), UtmTokenSchema])

const UtmLabelSchema = z.string().trim().min(1).max(64)

export const UtmSourceCreateSchema = z.object({
  value: UtmTokenSchema,
  label: UtmLabelSchema,
})

export const UtmSourceDeleteSchema = z.object({
  value: UtmTokenSchema,
})

export const UtmOptionCreateSchema = z.object({
  source: UtmSourceValueSchema,
  branch: z.enum(utmBranches),
  value: UtmTokenSchema,
  label: UtmLabelSchema,
})

export const UtmOptionDeleteSchema = z.object({
  source: UtmSourceValueSchema,
  branch: z.enum(utmBranches),
  value: UtmTokenSchema,
})

export type UtmSourceCreate = z.infer<typeof UtmSourceCreateSchema>
export type UtmOptionCreate = z.infer<typeof UtmOptionCreateSchema>
export type UtmOptionDelete = z.infer<typeof UtmOptionDeleteSchema>

export interface UtmOptionItem {
  value: string
  label: string
}

export interface UtmCatalogSource {
  value: string
  label: string
  fallback: boolean
  presets: {
    medium: UtmOptionItem[]
    campaign: UtmOptionItem[]
    term: UtmOptionItem[]
    content: {
      categories: UtmOptionItem[]
      themes: UtmOptionItem[]
    }
  }
}
