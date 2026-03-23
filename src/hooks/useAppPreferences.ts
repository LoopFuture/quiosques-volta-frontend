import { useContext } from 'react'
import { ThemePreferenceContext } from '@/components/Provider'

export function useAppPreferences() {
  const value = useContext(ThemePreferenceContext)

  if (!value) {
    throw new Error('useAppPreferences must be used within Provider')
  }

  return value
}

export function useThemePreference() {
  return useAppPreferences()
}
