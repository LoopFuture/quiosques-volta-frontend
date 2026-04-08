import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import type { ReactNode } from 'react'

import TabLayout from '@/app/(tabs)/_layout'
import RootLayout, {
  ErrorBoundary as RootErrorBoundary,
  unstable_settings,
} from '@/app/_layout'
import ProfileLayout from '@/app/profile/_layout'
import WalletLayout from '@/app/wallet/_layout'

jest.mock('expo-font', () => {
  const mockUseFonts = jest.fn()

  return {
    __mockUseFonts: mockUseFonts,
    useFonts: mockUseFonts,
  }
})

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../support/expo-router-mock',
  )

  return createExpoRouterMock({
    includeErrorBoundary: true,
    includeSplashScreen: true,
    includeTabs: true,
  })
})

jest.mock('expo-status-bar', () => ({
  StatusBar: ({ style }: { style: string }) => {
    const { Text } = jest.requireActual('react-native')

    return <Text>{`status:${style}`}</Text>
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@/components/Provider', () => ({
  Provider: ({ children }: { children: ReactNode }) => children,
}))

jest.mock('@/components/ui', () => {
  const { Text, View } = jest.requireActual('react-native')

  return {
    QueryErrorState: ({
      onRetry,
      testID,
    }: {
      onRetry: () => void
      testID: string
    }) => (
      <Text onPress={onRetry} testID={testID}>
        retry
      </Text>
    ),
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: ReactNode
      testID: string
    }) => <View testID={testID}>{children}</View>,
  }
})

jest.mock('@/features/app-data/monitoring', () => ({
  getSentryRuntimeConfig: jest.fn(() => ({
    enabled: false,
  })),
  initializeMonitoring: jest.fn(),
  recordDiagnosticEvent: jest.fn(),
  registerNavigationContainer: jest.fn(),
}))

jest.mock(
  '@/features/notifications/components/PushNotificationsObserver',
  () => ({
    PushNotificationsObserver: () => null,
  }),
)

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/features/profile/hooks', () => ({
  useProfileQuery: jest.fn(),
}))

jest.mock('@/features/app-shell/components/BottomTabBar', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    BottomTabBar: jest.fn(() => <Text>bottom-nav</Text>),
  }
})

jest.mock('@tamagui/lucide-icons', () => ({
  ArrowLeft: () => null,
  Home: () => null,
  Map: () => null,
  QrCode: () => null,
  User: () => null,
  Wallet: () => null,
}))

jest.mock('tamagui', () => {
  const { View } = jest.requireActual('react-native')
  const mockUseThemeName = jest.fn()

  return {
    YStack: ({ children, ...props }: { children: ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    __mockUseThemeName: mockUseThemeName,
    useThemeName: mockUseThemeName,
  }
})

jest.mock('@/themes', () => ({
  getTabBarBackground: jest.fn(() => '#F3F7FC'),
}))

const { __mockUseFonts: mockUseFonts } = jest.requireMock('expo-font')
const {
  __mockHideAsync: mockHideAsync,
  __mockRouterNavigate: mockRouterNavigate,
  __mockStack: mockStack,
  __mockStackProtected: mockStackProtected,
  __mockStackScreen: mockStackScreen,
  __mockTabs: mockTabs,
  __mockTabsScreen: mockTabsScreen,
} = jest.requireMock('expo-router')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
const { useProfileQuery: mockUseProfileQuery } = jest.requireMock(
  '@/features/profile/hooks',
)
const { BottomTabBar: mockBottomTabBar } = jest.requireMock(
  '@/features/app-shell/components/BottomTabBar',
)
const {
  initializeMonitoring,
  recordDiagnosticEvent,
  registerNavigationContainer,
} = jest.requireMock('@/features/app-data/monitoring')
const { __mockUseThemeName: mockUseThemeName } = jest.requireMock('tamagui')

function createAuthSessionMock(overrides: Record<string, unknown> = {}) {
  return {
    canAccessProtectedApp: false,
    status: 'anonymous',
    ...overrides,
  }
}

describe('app layouts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFonts.mockReturnValue([true, null])
    mockUseAuthSession.mockReturnValue(createAuthSessionMock())
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseThemeName.mockReturnValue('light')
  })

  it('declares auth as the initial route and waits for fonts before rendering', () => {
    mockUseFonts.mockReturnValue([false, null])

    const view = render(<RootLayout />)

    expect(unstable_settings.initialRouteName).toBe('auth')
    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  it('renders the root stack and hides the splash screen when navigation is ready', async () => {
    render(<RootLayout />)

    await waitFor(() => {
      expect(registerNavigationContainer).toHaveBeenCalled()
      expect(mockHideAsync).toHaveBeenCalled()
    })

    expect(screen.getByText('status:dark')).toBeTruthy()
    expect(
      mockStackProtected.mock.calls.map((call: [any]) => call[0].guard),
    ).toEqual([true, false, false])
    expect(
      mockStackScreen.mock.calls.map((call: [any]) => call[0].name),
    ).toEqual(['auth', 'setup', '(tabs)', 'profile', 'wallet'])
  })

  it('renders the profile bootstrap error state and retries profile loading', async () => {
    const refetch = jest.fn()

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch,
    })

    render(<RootLayout />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-bootstrap-error-screen')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-bootstrap-error-state'))

    expect(refetch).toHaveBeenCalled()
  })

  it('enables the protected app stack when profile setup is completed', async () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: {
        onboarding: {
          status: 'completed',
        },
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    render(<RootLayout />)

    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalled()
    })

    expect(
      mockStackProtected.mock.calls.map((call: [any]) => call[0].guard),
    ).toEqual([false, false, true])
  })

  it('captures route errors through the root error boundary only once per render', async () => {
    const error = new Error('boom')
    const retry = jest.fn()
    const view = render(<RootErrorBoundary error={error} retry={retry} />)

    await waitFor(() => {
      expect(initializeMonitoring).toHaveBeenCalled()
      expect(recordDiagnosticEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          captureError: true,
          details: {
            message: 'boom',
            name: 'Error',
          },
          domain: 'router',
          error,
          operation: 'route',
          phase: 'error-boundary',
          status: 'error',
        }),
      )
    })

    view.rerender(<RootErrorBoundary error={error} retry={retry} />)

    expect(recordDiagnosticEvent).toHaveBeenCalledTimes(1)
  })

  it('configures tabs, tab labels, and tab interactions', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const screens = mockTabsScreen.mock.calls.map((call: [any]) => call[0])
    const emit = jest.fn(() => ({ defaultPrevented: false }))

    expect(tabsProps.screenOptions).toEqual({
      headerShown: false,
    })
    expect(screens.map((tab: { name: string }) => tab.name)).toEqual([
      'index',
      'map',
      'barcode',
      'wallet',
      'profile',
    ])
    expect(
      screens.map((tab: { options: { title: string } }) => tab.options.title),
    ).toEqual([
      'tabs.home.label',
      'tabs.map.label',
      'tabs.barcode.label',
      'tabs.wallet.label',
      'tabs.profile.label',
    ])

    render(
      tabsProps.tabBar({
        insets: { bottom: 20 },
        navigation: { emit },
        state: {
          index: 0,
          routes: [
            { key: 'index-key', name: 'index' },
            { key: 'map-key', name: 'map' },
            { key: 'barcode-key', name: 'barcode' },
            { key: 'wallet-key', name: 'wallet' },
            { key: 'profile-key', name: 'profile' },
          ],
        },
      }),
    )

    const navItems = mockBottomTabBar.mock.calls[0][0].items
    const homeItem = navItems.find(
      (item: { key: string }) => item.key === 'home',
    )
    const mapItem = navItems.find((item: { key: string }) => item.key === 'map')

    expect(navItems).toHaveLength(5)
    expect(homeItem).toBeDefined()
    expect(mapItem).toBeDefined()

    if (!homeItem || !mapItem) {
      throw new Error('Expected home and map tab items to be defined.')
    }

    expect(homeItem.accessibilityState).toEqual({ selected: true })
    expect(mapItem.accessibilityState).toEqual({ selected: false })

    homeItem.onPress()
    mapItem.onLongPress()
    mapItem.onPress()

    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      target: 'index-key',
      type: 'tabPress',
    })
    expect(emit).toHaveBeenCalledWith({
      target: 'map-key',
      type: 'tabLongPress',
    })
    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      target: 'map-key',
      type: 'tabPress',
    })
    expect(mockRouterNavigate).toHaveBeenCalledWith('/map')
  })

  it('configures nested stack layouts without headers', () => {
    render(<ProfileLayout />)
    render(<WalletLayout />)

    expect(
      mockStack.mock.calls.map((call: [any]) => call[0].screenOptions),
    ).toEqual([{ headerShown: false }, { headerShown: false }])
  })
})
