import { waitForMockApi } from './delay'
import { readHomeResponse } from './state'

export async function getMockHomeScreenState() {
  await waitForMockApi()

  return readHomeResponse()
}
