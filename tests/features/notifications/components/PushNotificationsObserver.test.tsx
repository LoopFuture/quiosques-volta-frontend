import { render, waitFor } from '@testing-library/react-native'
import { PushNotificationsObserver } from '@/features/notifications/components/PushNotificationsObserver'
import { PushNotificationsProvider } from '@/features/notifications/components/PushNotificationsProvider'
import { createMockExpoConfig } from '@tests/support/expo-config'

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

const { __mockRouterPush: mockRouterPush } = jest.requireMock('expo-router')
const { __setExpoConfig } = jest.requireMock('expo-constants')
const {
  __emitNotificationResponseReceived,
  __setLastNotificationResponse,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  clearLastNotificationResponseAsync,
} = jest.requireMock('expo-notifications')
const { addBreadcrumb } = jest.requireMock('@sentry/react-native')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)

function renderObserver() {
  return render(
    <PushNotificationsProvider>
      <PushNotificationsObserver />
    </PushNotificationsProvider>,
  )
}

describe('push notifications observer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
    mockUseAuthSession.mockReturnValue({
      identity: null,
      isAuthenticated: false,
      session: null,
      signOut: jest.fn(),
      status: 'anonymous',
    })
  })

  it('routes cold-start notification taps to the payload url when present', async () => {
    __setLastNotificationResponse({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          content: {
            data: {
              url: '/profile/privacy',
            },
          },
          identifier: 'response-1',
        },
      },
    })

    renderObserver()

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/profile/privacy')
      expect(clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1)
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'notification-response.route.success',
      }),
    )
  })

  it('falls back to the home route when the payload does not include a valid url', async () => {
    __setLastNotificationResponse({
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          content: {
            data: {},
          },
          identifier: 'response-2',
        },
      },
    })

    renderObserver()

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/')
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: expect.objectContaining({
            usedFallbackRoute: true,
          }),
        }),
        message: 'notification-response.route.info',
      }),
    )
  })

  it('ignores notification actions that are not the default open action', async () => {
    renderObserver()

    __emitNotificationResponseReceived({
      actionIdentifier: 'dismiss',
      notification: {
        request: {
          content: {
            data: {
              url: '/profile/privacy',
            },
          },
          identifier: 'response-ignored',
        },
      },
    })

    await waitFor(() => {
      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'notification-response.route.info',
        }),
      )
    })

    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(clearLastNotificationResponseAsync).not.toHaveBeenCalled()
  })

  it('deduplicates repeated notification responses', async () => {
    renderObserver()

    const response = {
      actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      notification: {
        request: {
          content: {
            data: {
              url: '/wallet',
            },
          },
          identifier: 'response-duplicate',
        },
      },
    }

    __emitNotificationResponseReceived(response)
    __emitNotificationResponseReceived(response)

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/wallet')
    })

    expect(mockRouterPush).toHaveBeenCalledTimes(1)
    expect(clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1)
  })

  it('cleans up notification listeners on unmount', () => {
    const view = renderObserver()
    const foregroundSubscription =
      addNotificationReceivedListener.mock.results[0]?.value
    const responseSubscription =
      addNotificationResponseReceivedListener.mock.results[0]?.value

    view.unmount()

    expect(foregroundSubscription.remove).toHaveBeenCalledTimes(1)
    expect(responseSubscription.remove).toHaveBeenCalledTimes(1)
  })
})
