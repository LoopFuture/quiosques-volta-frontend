import { act } from '@testing-library/react-native'
import { getMockHomeScreenState } from '@/features/app-data/mock/home'
import { MOCK_API_DELAY_MS } from '@/features/app-data/mock'

describe('home models', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('builds the backend-shaped home response from mock backend state', async () => {
    const homeResponsePromise = getMockHomeScreenState()

    await act(async () => {
      jest.advanceTimersByTime(MOCK_API_DELAY_MS)
      await Promise.resolve()
    })

    const homeResponse = await homeResponsePromise

    expect(homeResponse.walletBalance.amountMinor).toBe(470)
    expect(homeResponse.stats.returnedPackagesCount).toBe(30)
    expect(homeResponse.recentActivity[0]?.id).toBe(
      '11111111-1111-4111-8111-111111111111',
    )
    expect(homeResponse.greeting.displayName).toBe('Joao Ferreira')
    expect(homeResponse.unreadNotificationsCount).toBe(2)
  })
})
