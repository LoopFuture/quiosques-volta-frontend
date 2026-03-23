import { clientStorage } from '../mmkv'

export const ONBOARDING_COMPLETED_STORAGE_KEY = 'onboarding.completed'
export const onboardingPreferenceStorage = clientStorage

export function hasCompletedOnboarding(value?: string) {
  return value === 'true'
}
