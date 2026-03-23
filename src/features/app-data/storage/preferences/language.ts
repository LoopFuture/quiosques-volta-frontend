import type { AppLocale } from '@/i18n'
import { clientStorage } from '../mmkv'

export type LanguageMode = 'system' | AppLocale

export const LANGUAGE_MODE_STORAGE_KEY = 'languageMode'
export const languagePreferenceStorage = clientStorage

export function parseLanguageMode(value?: string): LanguageMode {
  if (value === 'pt' || value === 'en' || value === 'system') {
    return value
  }

  return 'system'
}
