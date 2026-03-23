import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/features/app-data/query'
import { fetchBarcodeScreenState } from '../api'

export function useBarcodeScreenQuery() {
  return useQuery({
    meta: {
      feature: 'barcode',
      operation: 'screen-state',
    },
    queryFn: ({ signal }) => fetchBarcodeScreenState(signal),
    queryKey: appQueryKeys.barcode.screen(),
  })
}
