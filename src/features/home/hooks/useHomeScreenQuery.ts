import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/features/app-data/query'
import { fetchHomeScreenState } from '../api'

export function useHomeScreenQuery() {
  return useQuery({
    meta: {
      feature: 'home',
      operation: 'screen-state',
    },
    queryFn: ({ signal }) => fetchHomeScreenState(signal),
    queryKey: appQueryKeys.home.state(),
  })
}
