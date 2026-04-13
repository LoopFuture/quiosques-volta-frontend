import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import * as ReactNative from 'react-native'
import * as I18nModule from '@/i18n'
import { Provider } from '@/components/Provider'
import { useThemePreference } from '@/hooks/useAppPreferences'
import {
  LANGUAGE_MODE_STORAGE_KEY,
  languagePreferenceStorage,
} from '@/features/app-data/storage/preferences/language'
import {
  THEME_MODE_STORAGE_KEY,
  themePreferenceStorage,
} from '@/features/app-data/storage/preferences/theme'
import type {
  MockToastProviderProps,
  MockToastViewportProps,
} from '@tests/support/tamagui-toast-mock'

const mockUseToastState = jest.fn()
const mockTamaguiMount = jest.fn()
const mockTamaguiUnmount = jest.fn()
const mockPassiveChildRender = jest.fn()

jest.mock('@tamagui/toast', () => {
  const { View } = jest.requireActual('react-native')
  const { createTamaguiToastMock } = jest.requireActual(
    '@tests/support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    renderToastProvider: ({
      children,
      duration,
      swipeDirection,
      native,
    }: MockToastProviderProps) => (
      <View
        testID="toast-provider"
        accessibilityLabel={`${swipeDirection}:${duration}:${native?.length ?? 0}`}
      >
        {children}
      </View>
    ),
    renderToastViewport: (props: MockToastViewportProps) => (
      <View testID="toast-viewport" {...props} />
    ),
    useToastState: () => mockUseToastState(),
  })
})

jest.mock('@/features/auth/components/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: any) => children,
}))

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('tamagui', () => {
  const React = jest.requireActual('react')
  const actual = jest.requireActual('tamagui')
  const { View } = jest.requireActual('react-native')

  return {
    ...actual,
    TamaguiProvider: ({ children, defaultTheme }: any) => {
      React.useEffect(() => {
        mockTamaguiMount()

        return () => {
          mockTamaguiUnmount()
        }
      }, [])

      return (
        <View testID="tamagui-provider" accessibilityLabel={defaultTheme}>
          {children}
        </View>
      )
    },
  }
})

describe('provider behavior', () => {
  const addEventListenerSpy = jest.spyOn(
    ReactNative.AppState,
    'addEventListener',
  )
  const syncLocaleSpy = jest.spyOn(I18nModule, 'syncLocale')
  const useColorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme')
  const originalPlatform = ReactNative.Platform.OS
  const mockAppStateSubscription = {
    remove: jest.fn(),
  }
  const { useAuthSession: mockUseAuthSession } = jest.requireMock(
    '@/features/auth/hooks/useAuthSession',
  )

  function setPlatformOS(os: typeof ReactNative.Platform.OS) {
    Object.defineProperty(ReactNative.Platform, 'OS', {
      configurable: true,
      value: os,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastState.mockReturnValue(null)
    syncLocaleSpy.mockReturnValue('pt')
    languagePreferenceStorage.clearAll()
    themePreferenceStorage.clearAll()
    useColorSchemeSpy.mockReturnValue('light')
    addEventListenerSpy.mockImplementation(
      () => mockAppStateSubscription as never,
    )
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
    addEventListenerSpy.mockRestore()
    syncLocaleSpy.mockRestore()
    useColorSchemeSpy.mockRestore()
  })

  it('uses the dark theme when the device is dark', () => {
    useColorSchemeSpy.mockReturnValue('dark')

    render(
      <Provider>
        <Text>Child content</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('dark')
    expect(screen.getByTestId('toast-provider').props.accessibilityLabel).toBe(
      'horizontal:4000:0',
    )
    expect(screen.getByTestId('toast-viewport')).toBeTruthy()
    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('falls back to the light theme when the device scheme is not dark', () => {
    useColorSchemeSpy.mockReturnValue('light')

    render(
      <Provider>
        <Text>Fallback theme</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('light')
    expect(screen.getByText('Fallback theme')).toBeTruthy()
  })

  it('follows the phone theme when the stored mode is system', () => {
    themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'system')
    useColorSchemeSpy.mockReturnValue('dark')

    render(
      <Provider>
        <Text>System theme</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('dark')
    expect(screen.getByText('System theme')).toBeTruthy()
  })

  it('uses the stored light mode when the device is dark', () => {
    themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'light')
    useColorSchemeSpy.mockReturnValue('dark')

    render(
      <Provider>
        <Text>Forced light</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('light')
    expect(screen.getByText('Forced light')).toBeTruthy()
  })

  it('uses the stored dark mode when the device is light', () => {
    themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'dark')
    useColorSchemeSpy.mockReturnValue('light')

    render(
      <Provider>
        <Text>Forced dark</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('dark')
    expect(screen.getByText('Forced dark')).toBeTruthy()
  })

  it('treats invalid stored values as system', () => {
    themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'sepia')
    useColorSchemeSpy.mockReturnValue('dark')

    function ThemeModeHarness() {
      const { resolvedTheme, themeMode } = useThemePreference()

      return (
        <>
          <Text>{`mode:${themeMode}`}</Text>
          <Text>{`resolved:${resolvedTheme}`}</Text>
        </>
      )
    }

    render(
      <Provider>
        <ThemeModeHarness />
      </Provider>,
    )

    expect(screen.getByText('mode:system')).toBeTruthy()
    expect(screen.getByText('resolved:dark')).toBeTruthy()
  })

  it('updates and persists the selected theme mode', () => {
    function ThemeModeHarness() {
      const { resolvedTheme, setThemeMode, themeMode } = useThemePreference()

      return (
        <>
          <Text>{`mode:${themeMode}`}</Text>
          <Text>{`resolved:${resolvedTheme}`}</Text>
          <Text onPress={() => setThemeMode('dark')}>Set dark</Text>
        </>
      )
    }

    render(
      <Provider>
        <ThemeModeHarness />
      </Provider>,
    )

    fireEvent.press(screen.getByText('Set dark'))

    expect(screen.getByText('mode:dark')).toBeTruthy()
    expect(screen.getByText('resolved:dark')).toBeTruthy()
    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('dark')
    expect(themePreferenceStorage.getString(THEME_MODE_STORAGE_KEY)).toBe(
      'dark',
    )
  })

  it('uses the stored language override over the device locale', () => {
    languagePreferenceStorage.set(LANGUAGE_MODE_STORAGE_KEY, 'en')
    syncLocaleSpy.mockReturnValue('en')

    function LanguageModeHarness() {
      const { languageMode, resolvedLocale } = useThemePreference()

      return (
        <>
          <Text>{`language:${languageMode}`}</Text>
          <Text>{`locale:${resolvedLocale}`}</Text>
        </>
      )
    }

    render(
      <Provider>
        <LanguageModeHarness />
      </Provider>,
    )

    expect(screen.getByText('language:en')).toBeTruthy()
    expect(screen.getByText('locale:en')).toBeTruthy()
    expect(syncLocaleSpy).toHaveBeenCalledWith('en')
  })

  it('keeps the system language mode when no override is stored', () => {
    syncLocaleSpy.mockReturnValue('en')

    function LanguageModeHarness() {
      const { languageMode, resolvedLocale } = useThemePreference()

      return (
        <>
          <Text>{`language:${languageMode}`}</Text>
          <Text>{`locale:${resolvedLocale}`}</Text>
        </>
      )
    }

    render(
      <Provider>
        <LanguageModeHarness />
      </Provider>,
    )

    expect(screen.getByText('language:system')).toBeTruthy()
    expect(screen.getByText('locale:en')).toBeTruthy()
    expect(syncLocaleSpy).toHaveBeenCalledWith('system')
  })

  it('updates and persists the selected language mode', () => {
    syncLocaleSpy.mockReturnValueOnce('pt').mockReturnValue('en')

    function LanguageModeHarness() {
      const { languageMode, resolvedLocale, setLanguageMode } =
        useThemePreference()

      return (
        <>
          <Text>{`language:${languageMode}`}</Text>
          <Text>{`locale:${resolvedLocale}`}</Text>
          <Text onPress={() => setLanguageMode('en')}>Set English</Text>
        </>
      )
    }

    render(
      <Provider>
        <LanguageModeHarness />
      </Provider>,
    )

    fireEvent.press(screen.getByText('Set English'))

    expect(screen.getByText('language:en')).toBeTruthy()
    expect(screen.getByText('locale:en')).toBeTruthy()
    expect(languagePreferenceStorage.getString(LANGUAGE_MODE_STORAGE_KEY)).toBe(
      'en',
    )
  })

  it('rerenders locale consumers without remounting when the selected language mode changes', () => {
    syncLocaleSpy.mockReturnValueOnce('pt').mockReturnValue('en')

    function LocaleConsumer() {
      const { resolvedLocale } = useThemePreference()

      mockPassiveChildRender(resolvedLocale)

      return <Text>{`locale:${resolvedLocale}`}</Text>
    }

    function LanguageModeHarness() {
      const { setLanguageMode } = useThemePreference()

      return <Text onPress={() => setLanguageMode('en')}>Set English</Text>
    }

    render(
      <Provider>
        <>
          <LanguageModeHarness />
          <LocaleConsumer />
        </>
      </Provider>,
    )

    fireEvent.press(screen.getByText('Set English'))

    expect(screen.getByText('locale:en')).toBeTruthy()
    expect(mockPassiveChildRender.mock.calls.length).toBeGreaterThan(1)
    expect(mockTamaguiMount).toHaveBeenCalledTimes(1)
    expect(mockTamaguiUnmount).not.toHaveBeenCalled()
  })

  it('registers the android app state listener, ignores inactive changes, and cleans up on unmount', () => {
    setPlatformOS('android')

    const view = render(
      <Provider>
        <Text>Android child</Text>
      </Provider>,
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )

    const handleAppStateChange = addEventListenerSpy.mock.calls[0][1] as (
      state: ReactNative.AppStateStatus,
    ) => void

    act(() => {
      handleAppStateChange('background')
    })

    expect(syncLocaleSpy).toHaveBeenCalledTimes(1)
    expect(mockTamaguiMount).toHaveBeenCalledTimes(1)
    expect(mockTamaguiUnmount).not.toHaveBeenCalled()

    view.unmount()

    expect(mockAppStateSubscription.remove).toHaveBeenCalledTimes(1)
  })

  it('keeps the provider subtree mounted when the android locale stays the same', () => {
    setPlatformOS('android')

    render(
      <Provider>
        <Text>Stable locale</Text>
      </Provider>,
    )

    const handleAppStateChange = addEventListenerSpy.mock.calls[0][1] as (
      state: ReactNative.AppStateStatus,
    ) => void

    act(() => {
      handleAppStateChange('active')
    })

    expect(syncLocaleSpy).toHaveBeenCalledTimes(2)
    expect(mockTamaguiMount).toHaveBeenCalledTimes(1)
    expect(mockTamaguiUnmount).not.toHaveBeenCalled()
  })

  it('rerenders locale consumers without remounting when the android locale changes while active', () => {
    setPlatformOS('android')
    syncLocaleSpy.mockReturnValueOnce('pt').mockReturnValueOnce('en')

    function LocaleConsumer() {
      const { resolvedLocale } = useThemePreference()

      mockPassiveChildRender(resolvedLocale)

      return <Text>{`locale:${resolvedLocale}`}</Text>
    }

    render(
      <Provider>
        <LocaleConsumer />
      </Provider>,
    )

    const handleAppStateChange = addEventListenerSpy.mock.calls[0][1] as (
      state: ReactNative.AppStateStatus,
    ) => void

    act(() => {
      handleAppStateChange('active')
    })

    expect(syncLocaleSpy).toHaveBeenCalledTimes(2)
    expect(screen.getByText('locale:en')).toBeTruthy()
    expect(mockPassiveChildRender.mock.calls.length).toBeGreaterThan(1)
    expect(mockTamaguiMount).toHaveBeenCalledTimes(1)
    expect(mockTamaguiUnmount).not.toHaveBeenCalled()
  })
})
