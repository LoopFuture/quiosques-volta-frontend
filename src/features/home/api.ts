import { request } from '@/features/app-data/api'
import {
  getHomeGreetingDisplayName,
  homeResponseSchema,
  type HomeResponse,
} from './models'

export async function fetchHomeScreenState(signal?: AbortSignal) {
  const response = homeResponseSchema.parse(
    await request<HomeResponse>({
      meta: {
        feature: 'home',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/api/v1/home',
      signal,
    }),
  )

  return {
    ...response,
    greeting: {
      ...response.greeting,
      displayName: getHomeGreetingDisplayName(response.greeting.displayName),
    },
  }
}
