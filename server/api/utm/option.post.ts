import { UtmOptionCreateSchema } from '#shared/schemas/utm'
import { createUtmOption } from '../../services/utm-store'

defineRouteMeta({
  openAPI: {
    description: 'Add an option to a UTM source branch',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': {} },
    },
  },
})

export default eventHandler(async (event) => {
  const input = await readValidatedBody(event, UtmOptionCreateSchema.parse)
  await createUtmOption(event, input)
  setResponseStatus(event, 201)
  return { created: true }
})
