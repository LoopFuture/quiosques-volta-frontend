import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/features/app-data/query'
import { fetchMapScreenSnapshot } from '../api'

export function useMapScreenQuery() {
  return useQuery({
    meta: {
      feature: 'map',
      operation: 'screen-state',
    },
    queryFn: ({ signal }) => fetchMapScreenSnapshot(signal),
    queryKey: appQueryKeys.map.screen(),
  })
}
