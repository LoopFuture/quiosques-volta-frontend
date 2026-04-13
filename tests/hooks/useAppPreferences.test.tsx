import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ThemePreferenceContext } from '@/components/Provider'
import {
  useAppPreferences,
  useThemePreference,
} from '@/hooks/useAppPreferences'

describe('useAppPreferences', () => {
  it('throws when used outside the Provider', () => {
    function MissingProviderHarness() {
      useAppPreferences()

      return null
    }

    expect(() => render(<MissingProviderHarness />)).toThrow(
      'useAppPreferences must be used within Provider',
    )
  })

  it('exposes the same context through useThemePreference', () => {
    const preferenceValue = {
      languageMode: 'en' as const,
      resolvedLocale: 'en' as const,
      resolvedTheme: 'dark' as const,
      setLanguageMode: jest.fn(),
      setThemeMode: jest.fn(),
      themeMode: 'dark' as const,
    }

    function PreferenceHarness() {
      const { resolvedLocale, resolvedTheme } = useThemePreference()

      return <Text>{`${resolvedTheme}:${resolvedLocale}`}</Text>
    }

    const view = render(
      <ThemePreferenceContext.Provider value={preferenceValue}>
        <PreferenceHarness />
      </ThemePreferenceContext.Provider>,
    )

    expect(view.getByText('dark:en')).toBeTruthy()
  })
})
