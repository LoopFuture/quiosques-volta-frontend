import { render, screen } from '@testing-library/react-native'
import * as ReactNative from 'react-native'
import TabLayout from '@/app/(tabs)/_layout'
import RootLayout, { unstable_settings } from '@/app/_layout'

jest.mock('expo-font', () => {
  const mockUseFonts = jest.fn()

  return {
    __mockUseFonts: mockUseFonts,
    useFonts: mockUseFonts,
  }
})

jest.mock('expo-router', () => {
  const mockHideAsync = jest.fn()
  const mockLink = jest.fn(({ children }: any) => children)
  const mockPreventAutoHideAsync = jest.fn()
  const mockStackScreen = jest.fn(() => null)
  const mockTabsScreen = jest.fn(() => null)

  const Stack = Object.assign(
    jest.fn(({ children }: any) => children),
    { Screen: mockStackScreen },
  )

  const Tabs = Object.assign(
    jest.fn(({ children }: any) => children),
    { Screen: mockTabsScreen },
  )

  return {
    ErrorBoundary: () => null,
    Link: mockLink,
    SplashScreen: {
      hideAsync: mockHideAsync,
      preventAutoHideAsync: mockPreventAutoHideAsync,
    },
    Stack,
    Tabs,
    __mockHideAsync: mockHideAsync,
    __mockLink: mockLink,
    __mockPreventAutoHideAsync: mockPreventAutoHideAsync,
    __mockStack: Stack,
    __mockStackScreen: mockStackScreen,
    __mockTabs: Tabs,
    __mockTabsScreen: mockTabsScreen,
  }
})

jest.mock('expo-status-bar', () => ({
  StatusBar: ({ style }: any) => {
    const { Text } = jest.requireActual('react-native')

    return <Text>{`status:${style}`}</Text>
  },
}))

jest.mock('@tamagui/lucide-icons', () => ({
  Atom: () => null,
  AudioWaveform: () => null,
}))

jest.mock('@/components/Provider', () => ({
  Provider: ({ children }: any) => children,
}))

jest.mock('tamagui', () => {
  const { Text } = jest.requireActual('react-native')
  const mockUseTheme = jest.fn()

  return {
    Button: ({ children }: any) => <Text>{children}</Text>,
    __mockUseTheme: mockUseTheme,
    useTheme: mockUseTheme,
  }
})

const { __mockUseFonts: mockUseFonts } = jest.requireMock('expo-font')
const {
  __mockHideAsync: mockHideAsync,
  __mockLink: mockLink,
  __mockStackScreen: mockStackScreen,
  __mockTabs: mockTabs,
  __mockTabsScreen: mockTabsScreen,
} = jest.requireMock('expo-router')
const { __mockUseTheme: mockUseTheme } = jest.requireMock('tamagui')

describe('app layouts', () => {
  const useColorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFonts.mockReturnValue([true, null])
    mockUseTheme.mockReturnValue({
      background: { val: '#ffffff' },
      borderColor: { val: '#dddddd' },
      color: { val: '#111111' },
      accent10: { val: '#0cc3d7' },
    })
    useColorSchemeSpy.mockReturnValue('light')
  })

  afterAll(() => {
    useColorSchemeSpy.mockRestore()
  })

  it('configures the tab navigator from the active theme', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const [indexScreen, twoScreen] = mockTabsScreen.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(tabsProps.screenOptions).toEqual(
      expect.objectContaining({
        headerTintColor: '#111111',
        tabBarActiveTintColor: '#0cc3d7',
      }),
    )
    expect(indexScreen.name).toBe('index')
    expect(indexScreen.options.title).toBe('Tab One')
    expect(twoScreen.name).toBe('two')
    expect(twoScreen.options.title).toBe('Tab Two')

    render(indexScreen.options.tabBarIcon({ color: '#123456' }))
    render(twoScreen.options.tabBarIcon({ color: '#654321' }))
    render(indexScreen.options.headerRight())

    expect(screen.getByText('Hello!')).toBeTruthy()
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        asChild: true,
        href: '/modal',
      }),
      undefined,
    )
  })

  it('returns null while fonts are still loading', () => {
    mockUseFonts.mockReturnValue([false, null])

    const view = render(<RootLayout />)

    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
  })

  it('renders the root stack once fonts are loaded', () => {
    render(<RootLayout />)

    const stackScreens = mockStackScreen.mock.calls.map(
      (call: [any]) => call[0],
    )

    expect(mockUseFonts).toHaveBeenCalled()
    expect(mockHideAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByText('status:dark')).toBeTruthy()
    expect(unstable_settings.initialRouteName).toBe('(tabs)')
    expect(stackScreens[0]).toEqual(
      expect.objectContaining({
        name: '(tabs)',
        options: { headerShown: false },
      }),
    )
    expect(stackScreens[1]).toEqual(
      expect.objectContaining({
        name: 'modal',
        options: expect.objectContaining({
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#ffffff' },
          presentation: 'modal',
        }),
      }),
    )
  })

  it('renders the root stack when font loading returns an error', () => {
    mockUseFonts.mockReturnValue([false, new Error('fonts failed')])
    useColorSchemeSpy.mockReturnValue('dark')

    render(<RootLayout />)

    expect(mockHideAsync).toHaveBeenCalledTimes(1)
    expect(screen.getByText('status:light')).toBeTruthy()
    expect(mockStackScreen).toHaveBeenCalledTimes(2)
  })
})
