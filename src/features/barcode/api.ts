import { request } from '@/features/app-data/api'
import { barcodeResponseSchema, type RawBarcodeResponse } from './models'

export async function fetchBarcodeScreenState(signal?: AbortSignal) {
  return barcodeResponseSchema.parse(
    await request<RawBarcodeResponse>({
      meta: {
        feature: 'barcode',
        operation: 'screen-state',
      },
      method: 'GET',
      path: '/barcode',
      signal,
    }),
  )
}
