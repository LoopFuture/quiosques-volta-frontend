import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { useRef } from 'react'
import { Text } from 'react-native'
import * as ReactNative from 'react-native'
import { PushNotificationsProvider } from '@/features/notifications/components/PushNotificationsProvider'
import { usePushNotifications } from '@/features/notifications/hooks'
import { createMockExpoConfig } from '../support/expo-config'

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

const {
  __setNextNotificationPermissionRequestResponse,
  __setNotificationPermissions,
  getPermissionsAsync,
  getExpoPushTokenAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} = jest.requireMock('expo-notifications')
const { __setExpoConfig } = jest.requireMock('expo-constants')
const { __setIsDevice } = jest.requireMock('expo-device')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)

function PushNotificationsHarness() {
  const {
    expoPushToken,
    permissionStatus,
    requestPushPermissionAndToken,
    registrationErrorCode,
    syncExistingPushPermissionAndToken,
  } = usePushNotifications()
  const initialRequestPushPermissionAndToken = useRef(
    requestPushPermissionAndToken,
  )
  const initialSyncExistingPushPermissionAndToken = useRef(
    syncExistingPushPermissionAndToken,
  )

  return (
    <>
      <Text>{`status:${permissionStatus}`}</Text>
      <Text>{`token:${expoPushToken ?? 'none'}`}</Text>
      <Text>{`error:${registrationErrorCode ?? 'none'}`}</Text>
      <Text>{`request-stable:${String(initialRequestPushPermissionAndToken.current === requestPushPermissionAndToken)}`}</Text>
      <Text>{`sync-stable:${String(initialSyncExistingPushPermissionAndToken.current === syncExistingPushPermissionAndToken)}`}</Text>
      <Text
        onPress={() => {
          void requestPushPermissionAndToken()
        }}
      >
        Request notifications
      </Text>
      <Text
        onPress={() => {
          void syncExistingPushPermissionAndToken()
        }}
      >
        Sync notifications
      </Text>
    </>
  )
}

describe('push notifications provider', () => {
  const originalPlatform = ReactNative.Platform.OS

  function setPlatformOS(os: typeof ReactNative.Platform.OS) {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: os,
    })
  }

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
    __setIsDevice(true)
    mockUseAuthSession.mockReturnValue({
      identity: null,
      isAuthenticated: false,
      session: null,
      signOut: jest.fn(),
      status: 'anonymous',
    })
    setPlatformOS(originalPlatform)
  })

  afterAll(() => {
    setPlatformOS(originalPlatform)
  })

  it('syncs the existing permission state without prompting and stores the Expo token when already granted', async () => {
    __setNotificationPermissions({
      canAskAgain: false,
      granted: true,
      ios: {
        allowsAlert: true,
        allowsBadge: false,
        allowsSound: false,
        status: 2,
      },
      status: 'granted',
    })

    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Sync notifications'))

    await waitFor(() => {
      expect(screen.getByText('status:granted')).toBeTruthy()
      expect(
        screen.getByText('token:ExponentPushToken[mock-token]'),
      ).toBeTruthy()
      expect(screen.getByText('error:none')).toBeTruthy()
    })

    expect(requestPermissionsAsync).not.toHaveBeenCalled()
    expect(getExpoPushTokenAsync).toHaveBeenCalledTimes(1)
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'push-token.register.success',
      }),
    )
  })

  it('creates the Android channel before fetching the Expo push token', async () => {
    setPlatformOS('android')
    __setNotificationPermissions({
      granted: true,
      status: 'granted',
    })

    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Sync notifications'))

    await waitFor(() => {
      expect(getExpoPushTokenAsync).toHaveBeenCalledTimes(1)
      expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1)
    })

    expect(
      setNotificationChannelAsync.mock.invocationCallOrder[0],
    ).toBeLessThan(getExpoPushTokenAsync.mock.invocationCallOrder[0])
  })

  it('re-requests permission when notifications were denied but the OS still allows another prompt', async () => {
    __setNotificationPermissions({
      canAskAgain: true,
      granted: false,
      ios: {
        allowsAlert: false,
        allowsBadge: false,
        allowsSound: false,
        status: 0,
      },
      status: 'denied',
    })
    __setNextNotificationPermissionRequestResponse({
      canAskAgain: true,
      granted: true,
      ios: {
        allowsAlert: true,
        allowsBadge: false,
        allowsSound: false,
        status: 2,
      },
      status: 'granted',
    })

    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Request notifications'))

    await waitFor(() => {
      expect(requestPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(screen.getByText('status:granted')).toBeTruthy()
      expect(
        screen.getByText('token:ExponentPushToken[mock-token]'),
      ).toBeTruthy()
    })
  })

  it('keeps permission callbacks stable across sync state updates', async () => {
    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Sync notifications'))

    await waitFor(() => {
      expect(getPermissionsAsync).toHaveBeenCalledTimes(1)
      expect(screen.getByText('request-stable:true')).toBeTruthy()
      expect(screen.getByText('sync-stable:true')).toBeTruthy()
    })
  })

  it('reports device-required registration state without throwing on simulators', async () => {
    __setIsDevice(false)
    __setNotificationPermissions({
      granted: true,
      status: 'granted',
    })

    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Sync notifications'))

    await waitFor(() => {
      expect(screen.getByText('error:device-required')).toBeTruthy()
      expect(screen.getByText('token:none')).toBeTruthy()
    })

    expect(captureException).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'push-token.register.info',
      }),
    )
  })

  it('reports missing project id failures through diagnostics', async () => {
    __setExpoConfig({
      extra: {
        keycloak: createMockExpoConfig().extra.keycloak,
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      },
    })
    __setNotificationPermissions({
      granted: true,
      status: 'granted',
    })

    render(
      <PushNotificationsProvider>
        <PushNotificationsHarness />
      </PushNotificationsProvider>,
    )

    fireEvent.press(screen.getByText('Sync notifications'))

    await waitFor(() => {
      expect(screen.getByText('error:missing-project-id')).toBeTruthy()
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })
})
