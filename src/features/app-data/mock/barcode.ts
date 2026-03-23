import { waitForMockApi } from './delay'
import { readBarcodeResponse } from './state'

export async function getMockBarcodeScreenState() {
  await waitForMockApi()

  return readBarcodeResponse()
}
