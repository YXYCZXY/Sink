import { listUtmCatalog } from '../../services/utm-store'

defineRouteMeta({
  openAPI: {
    description: 'List UTM sources and their branch options',
    security: [{ bearerAuth: [] }],
  },
})

export default eventHandler(async event => await listUtmCatalog(event))
