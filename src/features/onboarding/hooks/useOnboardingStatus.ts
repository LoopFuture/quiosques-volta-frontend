import { useCallback } from 'react'
import { useMMKVString } from 'react-native-mmkv'
import {
  hasCompletedOnboarding,
  onboardingPreferenceStorage,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from '@/features/app-data/storage/device/onboarding'

export function useOnboardingStatus() {
  const [storedValue, setStoredValue] = useMMKVString(
    ONBOARDING_COMPLETED_STORAGE_KEY,
    onboardingPreferenceStorage,
  )

  const completeOnboarding = useCallback(() => {
    setStoredValue('true')
  }, [setStoredValue])

  return {
    completeOnboarding,
    hasCompletedOnboarding: hasCompletedOnboarding(storedValue),
  }
}
