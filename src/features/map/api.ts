import { request } from '@/features/app-data/api'
import {
  collectionPointListResponseSchema,
  type CollectionPointListResponse,
} from './models'

export async function fetchMapScreenSnapshot(signal?: AbortSignal) {
  return collectionPointListResponseSchema.parse(
    await request<CollectionPointListResponse>({
      meta: {
        feature: 'map',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/v1/locations/collection-points',
      query: {
        limit: 50,
      },
      signal,
    }),
  )
}
