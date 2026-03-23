import { waitForMockApi } from './delay'
import { readCollectionPoints } from './state'

export async function getMockMapScreenSnapshot() {
  await waitForMockApi()

  return readCollectionPoints()
}
