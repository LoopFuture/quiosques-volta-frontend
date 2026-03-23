import { getLocales } from 'expo-localization'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import pt from './locales/pt.json'

export const primaryLocale = 'pt'
export const fallbackLocale = 'en'
const defaultNamespace = 'app'

export const resources = {
  [primaryLocale]: pt,
  [fallbackLocale]: en,
} as const

export type AppLocale = keyof typeof resources
export type LocalePreference = 'system' | AppLocale

let localeOverrideForTests: string | null = null

function getDeviceLocale() {
  const locale = getLocales()[0]

  return (
    localeOverrideForTests ??
    locale.languageTag ??
    locale.languageCode ??
    primaryLocale
  )
}

export function resolveDeviceLocale(locale: string): AppLocale {
  return locale.toLowerCase().startsWith(fallbackLocale)
    ? fallbackLocale
    : primaryLocale
}

export const i18n = i18next

i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLocale(getDeviceLocale()),
  fallbackLng: primaryLocale,
  ns: [defaultNamespace],
  defaultNS: defaultNamespace,
  debug: __DEV__ && process.env.NODE_ENV !== 'test',
  showSupportNotice: false,
  interpolation: { escapeValue: false },
})

export function resolveAppLocale(
  localePreference: LocalePreference = 'system',
  deviceLocale = getDeviceLocale(),
): AppLocale {
  if (localePreference === 'system') {
    return resolveDeviceLocale(deviceLocale)
  }

  return localePreference
}

export function syncLocale(
  localePreference: LocalePreference = 'system',
): AppLocale {
  const locale = resolveAppLocale(localePreference)

  void i18n.changeLanguage(locale)

  return locale
}

export function setLocaleOverrideForTests(locale: string | null) {
  localeOverrideForTests = locale
}

export const t = i18n.t.bind(i18n) as typeof i18n.t

export default i18n
