import { UtmSourceCreateSchema } from '#shared/schemas/utm'
import { createUtmSource } from '../../services/utm-store'

defineRouteMeta({
  openAPI: {
    description: 'Create a new UTM source',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': {} },
    },
  },
})

export default eventHandler(async (event) => {
  const input = await readValidatedBody(event, UtmSourceCreateSchema.parse)
  await createUtmSource(event, input)
  setResponseStatus(event, 201)
  return { created: true }
})
