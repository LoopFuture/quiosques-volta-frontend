import { createContext, useCallback, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import * as Network from 'expo-network'
import { AppState, Platform, useColorScheme } from 'react-native'
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { I18nextProvider } from 'react-i18next'
import { useMMKVString } from 'react-native-mmkv'
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { CurrentToast } from './CurrentToast'
import { initializeMonitoring } from '@/features/app-data/monitoring'
import { AuthSessionProvider } from '@/features/auth/components/AuthSessionProvider'
import { createAppQueryClient } from '@/features/app-data/query'
import { PushNotificationsProvider } from '@/features/notifications/components/PushNotificationsProvider'
import { i18n, resolveAppLocale, syncLocale, type AppLocale } from '@/i18n'
import {
  LANGUAGE_MODE_STORAGE_KEY,
  languagePreferenceStorage,
  parseLanguageMode,
  type LanguageMode,
} from '@/features/app-data/storage/preferences/language'
import {
  parseThemeMode,
  resolveThemeMode,
  THEME_MODE_STORAGE_KEY,
  themePreferenceStorage,
  type ResolvedTheme,
  type ThemeMode,
} from '@/features/app-data/storage/preferences/theme'
import { config } from '@/tamagui.config'
type ThemePreferenceContextValue = {
  languageMode: LanguageMode
  resolvedTheme: ResolvedTheme
  resolvedLocale: AppLocale
  setLanguageMode: (languageMode: LanguageMode) => void
  setThemeMode: (themeMode: ThemeMode) => void
  themeMode: ThemeMode
}
export const ThemePreferenceContext =
  createContext<ThemePreferenceContextValue | null>(null)
export const ConnectivityContext = createContext<boolean>(false)
const fallbackSafeAreaMetrics = {
  frame: {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  },
  insets: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
}

function AppToastViewport() {
  const insets = useSafeAreaInsets()

  return (
    <ToastViewport
      items="stretch"
      top={insets.top + 12}
      left={16}
      right={16}
      width="auto"
    />
  )
}

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config' | 'defaultTheme'>) {
  const colorScheme = useColorScheme()
  const [storedThemeMode, setStoredThemeMode] = useMMKVString(
    THEME_MODE_STORAGE_KEY,
    themePreferenceStorage,
  )
  const [storedLanguageMode, setStoredLanguageMode] = useMMKVString(
    LANGUAGE_MODE_STORAGE_KEY,
    languagePreferenceStorage,
  )
  const [queryClient] = useState(() => {
    initializeMonitoring()

    return createAppQueryClient()
  })
  const [isOffline, setIsOffline] = useState(false)
  const themeMode = parseThemeMode(storedThemeMode)
  const languageMode = parseLanguageMode(storedLanguageMode)
  const [localeKey, setLocaleKey] = useState<AppLocale>(() =>
    resolveAppLocale(languageMode),
  )
  const resolvedTheme = resolveThemeMode(themeMode, colorScheme)
  const handleSessionCleared = useCallback(() => {
    queryClient.clear()
  }, [queryClient])
  useEffect(() => {
    const nextLocale = syncLocale(languageMode)
    setLocaleKey((currentLocale) =>
      currentLocale === nextLocale ? currentLocale : nextLocale,
    )
  }, [languageMode])
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return
      }
      setLocaleKey((currentLocale) => {
        const nextLocale = syncLocale(languageMode)
        return currentLocale === nextLocale ? currentLocale : nextLocale
      })
    })
    return () => {
      subscription.remove()
    }
  }, [languageMode])
  useEffect(() => {
    return () => {
      queryClient.clear()
    }
  }, [queryClient])
  useEffect(() => {
    let isMounted = true

    const updateConnectivityState = (state?: Network.NetworkState | null) => {
      if (!state) {
        return
      }

      const nextIsOffline =
        state.isConnected === false || state.isInternetReachable === false

      if (isMounted) {
        setIsOffline(nextIsOffline)
      }
    }

    void Network.getNetworkStateAsync().then(updateConnectivityState)

    const subscription = Network.addNetworkStateListener(
      updateConnectivityState,
    )

    return () => {
      isMounted = false
      subscription?.remove?.()
    }
  }, [])
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics ?? fallbackSafeAreaMetrics}
      >
        <ThemePreferenceContext.Provider
          value={{
            languageMode,
            resolvedTheme,
            resolvedLocale: localeKey,
            setLanguageMode: (nextLanguageMode) => {
              setStoredLanguageMode(nextLanguageMode)
            },
            setThemeMode: (nextThemeMode) => {
              setStoredThemeMode(nextThemeMode)
            },
            themeMode,
          }}
        >
          <AuthSessionProvider onSessionCleared={handleSessionCleared}>
            <ConnectivityContext.Provider value={isOffline}>
              <PushNotificationsProvider>
                <QueryClientProvider client={queryClient}>
                  <TamaguiProvider
                    config={config}
                    defaultTheme={resolvedTheme}
                    {...rest}
                  >
                    <ToastProvider swipeDirection="horizontal" duration={4000}>
                      {children}
                      <CurrentToast />
                      <AppToastViewport />
                    </ToastProvider>
                  </TamaguiProvider>
                </QueryClientProvider>
              </PushNotificationsProvider>
            </ConnectivityContext.Provider>
          </AuthSessionProvider>
        </ThemePreferenceContext.Provider>
      </SafeAreaProvider>
    </I18nextProvider>
  )
}
