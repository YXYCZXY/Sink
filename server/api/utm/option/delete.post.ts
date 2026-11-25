import { UtmOptionDeleteSchema } from '#shared/schemas/utm'
import { deleteUtmOption } from '../../../services/utm-store'

defineRouteMeta({
  openAPI: {
    description: 'Remove an option from a UTM source branch',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': {} },
    },
  },
})

export default eventHandler(async (event) => {
  const input = await readValidatedBody(event, UtmOptionDeleteSchema.parse)
  await deleteUtmOption(event, input)
  return { deleted: true }
})
