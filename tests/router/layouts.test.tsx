import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import TabLayout from '@/app/(tabs)/_layout'
import RootLayout, {
  ErrorBoundary as RootErrorBoundary,
  unstable_settings,
} from '@/app/_layout'
import ProfileLayout from '@/app/profile/_layout'
import WalletLayout from '@/app/wallet/_layout'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { createMockExpoConfig } from '../support/expo-config'

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
  StatusBar: ({ style }: any) => {
    const { Text } = jest.requireActual('react-native')

    return <Text>{`status:${style}`}</Text>
  },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  }),
}))

jest.mock('@tamagui/lucide-icons', () => ({
  Home: () => null,
  Map: () => null,
  QrCode: () => null,
  User: () => null,
  Wallet: () => null,
}))

jest.mock('@/components/Provider', () => ({
  Provider: ({ children }: any) => children,
}))

jest.mock('@/components/ui', () => {
  const { Text, View } = jest.requireActual('react-native')

  return {
    QueryErrorState: ({ onRetry, testID }: any) => (
      <Text onPress={onRetry} testID={testID}>
        retry
      </Text>
    ),
    ScreenContainer: ({ children, testID }: any) => (
      <View testID={testID}>{children}</View>
    ),
  }
})

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

jest.mock('tamagui', () => {
  const { Text, View } = jest.requireActual('react-native')
  const mockUseTheme = jest.fn()
  const mockUseThemeName = jest.fn()

  return {
    Button: ({ children }: any) => <Text>{children}</Text>,
    ScrollView: ({ children, testID }: any) => (
      <View testID={testID}>{children}</View>
    ),
    YStack: ({ children }: any) => <View>{children}</View>,
    __mockUseTheme: mockUseTheme,
    __mockUseThemeName: mockUseThemeName,
    useTheme: mockUseTheme,
    useThemeName: mockUseThemeName,
  }
})

const { __mockUseFonts: mockUseFonts } = jest.requireMock('expo-font')
const { __setExpoConfig } = jest.requireMock('expo-constants')
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
const { BottomTabBar: mockBottomNav } = jest.requireMock(
  '@/features/app-shell/components/BottomTabBar',
)
const { captureException } = jest.requireMock('@sentry/react-native')
const { __mockUseTheme: mockUseTheme, __mockUseThemeName: mockUseThemeName } =
  jest.requireMock('tamagui')

function createAuthSessionMock(overrides: Record<string, unknown> = {}) {
  return {
    canAccessProtectedApp: false,
    identity: null,
    isAppLocked: false,
    isAuthenticated: false,
    session: null,
    signOut: jest.fn(),
    status: 'anonymous',
    unlockWithBiometrics: jest.fn(),
    ...overrides,
  }
}

describe('app layouts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
    mockUseFonts.mockReturnValue([true, null])
    mockUseAuthSession.mockReturnValue(createAuthSessionMock())
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseTheme.mockReturnValue({
      accent10: {
        val: '#1d7f5f',
      },
    })
    mockUseThemeName.mockReturnValue('light')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('configures the tab navigator and screen titles', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const screens = mockTabsScreen.mock.calls.map((call: [any]) => call[0])
    const indexScreen = screens.find((screen: any) => screen.name === 'index')
    const mapScreen = screens.find((screen: any) => screen.name === 'map')
    const barcodeScreen = screens.find(
      (screen: any) => screen.name === 'barcode',
    )
    const walletScreen = screens.find((screen: any) => screen.name === 'wallet')
    const profileScreen = screens.find(
      (screen: any) => screen.name === 'profile',
    )

    expect(tabsProps.tabBar).toEqual(expect.any(Function))
    expect(tabsProps.screenOptions).toEqual(
      expect.objectContaining({
        headerShown: false,
      }),
    )
    expect(indexScreen.options.title).toBe('Início')
    expect(mapScreen.options.title).toBe('Mapa')
    expect(barcodeScreen.options.title).toBe('Código')
    expect(walletScreen.options.title).toBe('Carteira')
    expect(profileScreen.options.title).toBe('Perfil')
    expect(screens).toHaveLength(5)
  })

  it('builds tab bar items and routes tab interactions', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const emit = jest.fn().mockReturnValue({ defaultPrevented: false })

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

    const navItems = mockBottomNav.mock.calls[0][0].items
    const homeItem = navItems.find((item: any) => item.key === 'home')
    const mapItem = navItems.find((item: any) => item.key === 'map')

    expect(navItems).toHaveLength(5)
    expect(homeItem.accessibilityState).toEqual({ selected: true })
    expect(mapItem.accessibilityState).toEqual({ selected: false })

    mapItem.onLongPress()
    expect(emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'map-key',
    })

    emit.mockClear()
    mapItem.onPress()
    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      type: 'tabPress',
      target: 'map-key',
    })
    expect(mockRouterNavigate).toHaveBeenCalledWith('/map')

    emit.mockClear()
    mockRouterNavigate.mockClear()
    homeItem.onPress()
    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      type: 'tabPress',
      target: 'index-key',
    })
    expect(mockRouterNavigate).not.toHaveBeenCalled()
  })

  it('falls back to the index route and leaves missing routes non-interactive', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const emit = jest.fn().mockReturnValue({ defaultPrevented: true })

    render(
      tabsProps.tabBar({
        insets: { bottom: 0 },
        navigation: { emit },
        state: {
          index: 99,
          routes: [
            { key: 'index-key', name: 'index' },
            { key: 'map-key', name: 'map' },
          ],
        },
      }),
    )

    const navItems = mockBottomNav.mock.calls[0][0].items
    const homeItem = navItems.find((item: any) => item.key === 'home')
    const mapItem = navItems.find((item: any) => item.key === 'map')
    const profileItem = navItems.find((item: any) => item.key === 'profile')

    expect(homeItem.accessibilityState).toEqual({ selected: true })
    expect(mapItem.accessibilityState).toEqual({ selected: false })
    expect(profileItem.onLongPress).toBeUndefined()
    expect(profileItem.onPress).toBeUndefined()

    mapItem.onPress()
    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      type: 'tabPress',
      target: 'map-key',
    })
    expect(mockRouterNavigate).not.toHaveBeenCalled()
  })

  it('returns null while fonts are still loading', () => {
    mockUseFonts.mockReturnValue([false, null])

    const view = render(<RootLayout />)

    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  it('returns null while auth is still hydrating', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        status: 'hydrating',
      }),
    )

    const view = render(<RootLayout />)

    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  it('returns null while authenticated profile bootstrap is still loading', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      refetch: jest.fn(),
    })

    const view = render(<RootLayout />)

    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  it('renders the root stack once fonts are loaded', () => {
    render(<RootLayout />)

    const stackScreens = mockStackScreen.mock.calls.map(
      (call: [any]) => call[0],
    )
    const protectedGroups = mockStackProtected.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(mockUseFonts).toHaveBeenCalled()
    expect(mockHideAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByText('status:dark')).toBeTruthy()
    expect(unstable_settings.initialRouteName).toBe('auth')
    expect(protectedGroups[0]).toEqual(
      expect.objectContaining({
        guard: true,
      }),
    )
    expect(protectedGroups[1]).toEqual(
      expect.objectContaining({
        guard: false,
      }),
    )
    expect(protectedGroups[2]).toEqual(
      expect.objectContaining({
        guard: false,
      }),
    )
    expect(stackScreens[0]).toEqual(
      expect.objectContaining({
        name: 'auth',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[1]).toEqual(
      expect.objectContaining({
        name: 'setup',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[2]).toEqual(
      expect.objectContaining({
        name: '(tabs)',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[3]).toEqual(
      expect.objectContaining({
        name: 'profile',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[4]).toEqual(
      expect.objectContaining({
        name: 'wallet',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[5]).toEqual(
      expect.objectContaining({
        name: 'notifications',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens).toHaveLength(6)
  })

  it('renders the root stack when font loading returns an error', () => {
    mockUseFonts.mockReturnValue([false, new Error('fonts failed')])
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
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
    mockUseThemeName.mockReturnValue('dark')

    render(<RootLayout />)

    expect(mockHideAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByText('status:light')).toBeTruthy()
    expect(mockStackScreen).toHaveBeenCalledTimes(6)
  })

  it('opens the setup route for authenticated users without completed setup', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: {
        onboarding: {
          status: 'in_progress',
        },
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    render(<RootLayout />)

    const protectedGroups = mockStackProtected.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(protectedGroups[0].guard).toBe(false)
    expect(protectedGroups[1].guard).toBe(true)
    expect(protectedGroups[2].guard).toBe(false)
  })

  it('opens the main app only after setup is completed', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
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

    const protectedGroups = mockStackProtected.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(protectedGroups[0].guard).toBe(false)
    expect(protectedGroups[1].guard).toBe(false)
    expect(protectedGroups[2].guard).toBe(true)
  })

  it('keeps the auth route open when the user is authenticated but locked', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: false,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAppLocked: true,
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    render(<RootLayout />)

    const protectedGroups = mockStackProtected.mock.calls.map(
      (call: [any]) => call[0],
    )
    const stackScreens = mockStackScreen.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(protectedGroups[0].guard).toBe(true)
    expect(protectedGroups[1].guard).toBe(false)
    expect(protectedGroups[2].guard).toBe(false)
    expect(stackScreens[0]).toEqual(
      expect.objectContaining({
        name: 'auth',
        options: { headerShown: false },
      }),
    )
    expect(mockUseProfileQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    )
  })

  it('renders a retryable bootstrap error when the authenticated profile query fails', () => {
    const refetch = jest.fn()

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        identity: {
          email: 'ana.silva@sdr.pt',
          name: 'Ana Silva',
          userKey: 'user-123',
        },
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
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

    expect(screen.getByTestId('profile-bootstrap-error-screen')).toBeTruthy()
    fireEvent.press(screen.getByText('retry'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the profile detail stack with headers disabled', () => {
    render(<ProfileLayout />)

    expect(mockStack).toHaveBeenCalledWith(
      expect.objectContaining({
        screenOptions: { headerShown: false },
      }),
      undefined,
    )
  })

  it('renders the wallet detail stack with headers disabled', () => {
    render(<WalletLayout />)

    expect(mockStack).toHaveBeenCalledWith(
      expect.objectContaining({
        screenOptions: { headerShown: false },
      }),
      undefined,
    )
  })

  it('captures uncaught route errors through the root error boundary', async () => {
    render(
      <RootErrorBoundary error={new Error('route failed')} retry={jest.fn()} />,
    )

    await waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})
