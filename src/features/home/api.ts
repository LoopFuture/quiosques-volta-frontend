import { request } from '@/features/app-data/api'
import { homeResponseSchema, type HomeResponse } from './models'

export async function fetchHomeScreenState(signal?: AbortSignal) {
  return homeResponseSchema.parse(
    await request<HomeResponse>({
      meta: {
        feature: 'home',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/home',
      signal,
    }),
  )
}
