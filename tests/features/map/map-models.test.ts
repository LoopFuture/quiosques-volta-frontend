import { act } from '@testing-library/react-native'
import { getMockMapScreenSnapshot } from '@/features/app-data/mock/map'
import { MOCK_API_DELAY_MS } from '@/features/app-data/mock'

describe('map models', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('builds the backend-shaped collection point response', async () => {
    const mapSnapshotPromise = getMockMapScreenSnapshot()

    await act(async () => {
      jest.advanceTimersByTime(MOCK_API_DELAY_MS)
      await Promise.resolve()
    })

    const mapSnapshot = await mapSnapshotPromise

    expect(mapSnapshot.items).toHaveLength(2)
    expect(mapSnapshot.items[0]?.name).toBe('Colombo')
    expect(mapSnapshot.items[0]?.status).toBe('active')
  })
})
