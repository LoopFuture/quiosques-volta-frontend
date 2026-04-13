import type { ReactNode } from 'react'

jest.mock('expo-font', () => {
  const mockUseFonts = jest.fn()

  return {
    __mockUseFonts: mockUseFonts,
    useFonts: mockUseFonts,
  }
})

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
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

export const { __mockUseFonts: mockUseFonts } = jest.requireMock('expo-font')
export const {
  __mockHideAsync: mockHideAsync,
  __mockRouterNavigate: mockRouterNavigate,
  __mockStack: mockStack,
  __mockStackProtected: mockStackProtected,
  __mockStackScreen: mockStackScreen,
  __mockTabs: mockTabs,
  __mockTabsScreen: mockTabsScreen,
} = jest.requireMock('expo-router')
export const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
export const { useProfileQuery: mockUseProfileQuery } = jest.requireMock(
  '@/features/profile/hooks',
)
export const { BottomTabBar: mockBottomTabBar } = jest.requireMock(
  '@/features/app-shell/components/BottomTabBar',
)
export const {
  initializeMonitoring: mockInitializeMonitoring,
  recordDiagnosticEvent: mockRecordDiagnosticEvent,
  registerNavigationContainer: mockRegisterNavigationContainer,
} = jest.requireMock('@/features/app-data/monitoring')
export const { __mockUseThemeName: mockUseThemeName } =
  jest.requireMock('tamagui')

export function createAuthSessionMock(overrides: Record<string, unknown> = {}) {
  return {
    canAccessProtectedApp: false,
    status: 'anonymous',
    ...overrides,
  }
}

export function resetAppLayoutMocks() {
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
}
