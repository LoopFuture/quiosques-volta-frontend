import { act } from '@testing-library/react-native'
import { MOCK_API_DELAY_MS } from '@/features/app-data/mock'
import { getMockNotificationsState } from '@/features/app-data/mock/notifications'
import {
  getNotificationDestination,
  getNotificationDisplayCopy,
} from '@/features/notifications/presentation'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'

describe('notifications models', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('builds the raw notifications feed from backend-shaped mock data', async () => {
    const notificationsPromise = getMockNotificationsState()

    await act(async () => {
      jest.advanceTimersByTime(MOCK_API_DELAY_MS)
      await Promise.resolve()
    })

    const notifications = await notificationsPromise
    const transferCopy = getNotificationDisplayCopy(
      i18n.t.bind(i18n),
      'pt',
      notifications.items[0]!,
    )

    expect(notifications.items).toHaveLength(3)
    expect(notifications.items[0]?.id).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    )
    expect(getNotificationDestination(notifications.items[0]!)).toEqual({
      params: {
        movementId: '22222222-2222-4222-8222-222222222222',
      },
      pathname: '/wallet/[movementId]',
    })
    expect(transferCopy.title).toBe('Transfer update')
  })
})
