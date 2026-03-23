import type { ColorSchemeName } from 'react-native'
import { clientStorage } from '../mmkv'

export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_MODE_STORAGE_KEY = 'themeMode'
export const themePreferenceStorage = clientStorage

export function parseThemeMode(value?: string): ThemeMode {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value
  }

  return 'system'
}

export function resolveThemeMode(
  themeMode: ThemeMode,
  colorScheme: ColorSchemeName,
): ResolvedTheme {
  if (themeMode === 'system') {
    return colorScheme === 'dark' ? 'dark' : 'light'
  }

  return themeMode
}
