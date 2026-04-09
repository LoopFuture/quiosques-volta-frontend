import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import type { PushNotificationsContextValue } from '@/features/notifications/components/PushNotificationsProvider'
import { PushNotificationsContext } from '@/features/notifications/components/PushNotificationsProvider'
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications'

describe('usePushNotifications', () => {
  const contextValue: PushNotificationsContextValue = {
    canAskAgain: true,
    expoPushToken: 'ExponentPushToken[mock-token]',
    isPhysicalDevice: true,
    isSyncing: false,
    latestForegroundNotification: null,
    permissionStatus: 'granted',
    registrationErrorCode: null,
    requestPushPermissionAndToken: jest.fn(),
    syncExistingPushPermissionAndToken: jest.fn(),
    updateLatestForegroundNotification: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws when used outside the PushNotificationsProvider', () => {
    function MissingProviderHarness() {
      usePushNotifications()

      return null
    }

    expect(() => render(<MissingProviderHarness />)).toThrow(
      'usePushNotifications must be used within PushNotificationsProvider',
    )
  })

  it('returns the current push notifications context value', () => {
    function PushNotificationsHarness() {
      const { expoPushToken, permissionStatus } = usePushNotifications()

      return <Text>{`${permissionStatus}:${expoPushToken}`}</Text>
    }

    const view = render(
      <PushNotificationsContext.Provider value={contextValue}>
        <PushNotificationsHarness />
      </PushNotificationsContext.Provider>,
    )

    expect(view.getByText('granted:ExponentPushToken[mock-token]')).toBeTruthy()
  })
})
