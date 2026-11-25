import { UtmSourceDeleteSchema } from '#shared/schemas/utm'
import { deleteUtmSource } from '../../../services/utm-store'

defineRouteMeta({
  openAPI: {
    description: 'Delete a UTM source and its branch options',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': {} },
    },
  },
})

export default eventHandler(async (event) => {
  const { value } = await readValidatedBody(event, UtmSourceDeleteSchema.parse)
  await deleteUtmSource(event, value)
  return { deleted: true }
})
