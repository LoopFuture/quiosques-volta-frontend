import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react-native'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import {
  ErrorBoundary as ExpoRouterErrorBoundary,
  SplashScreen,
  Stack,
  useNavigationContainerRef,
  type ErrorBoundaryProps,
} from 'expo-router'
import { QueryErrorState, ScreenContainer } from '@/components/ui'
import { Provider } from '@/components/Provider'
import {
  getSentryRuntimeConfig,
  initializeMonitoring,
  recordDiagnosticEvent,
  registerNavigationContainer,
} from '@/features/app-data/monitoring'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { PushNotificationsObserver } from '@/features/notifications/components/PushNotificationsObserver'
import { useProfileQuery } from '@/features/profile/hooks'
import { useThemeName } from 'tamagui'
export const unstable_settings = {
  initialRouteName: 'auth',
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const hasCapturedErrorRef = useRef(false)

  useEffect(() => {
    if (hasCapturedErrorRef.current) {
      return
    }

    hasCapturedErrorRef.current = true
    initializeMonitoring()
    recordDiagnosticEvent({
      captureError: true,
      details: {
        message: error.message,
        name: error.name,
      },
      domain: 'router',
      error,
      operation: 'route',
      phase: 'error-boundary',
      status: 'error',
    })
  }, [error])

  return <ExpoRouterErrorBoundary error={error} retry={retry} />
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()
function RootLayout() {
  const [interLoaded, interError] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  if (!interLoaded && !interError) {
    return null
  }
  return (
    <Providers>
      <RootLayoutNav fontsReady={Boolean(interLoaded || interError)} />
    </Providers>
  )
}

const sentryRuntimeConfig = getSentryRuntimeConfig()

if (sentryRuntimeConfig.enabled) {
  initializeMonitoring()
}

export default sentryRuntimeConfig.enabled
  ? Sentry.wrap(RootLayout)
  : RootLayout
const Providers = ({ children }: { children: ReactNode }) => {
  return <Provider>{children}</Provider>
}
function RootLayoutNav({ fontsReady }: { fontsReady: boolean }) {
  const { canAccessProtectedApp, status } = useAuthSession()
  const {
    data: profile,
    isError: isProfileBootstrapError,
    isPending: isProfileBootstrapPending,
    refetch: refetchProfileBootstrap,
  } = useProfileQuery({
    enabled: canAccessProtectedApp,
  })
  const navigationContainerRef = useNavigationContainerRef()
  const themeName = useThemeName()
  const isProfileBootstrapReady =
    !canAccessProtectedApp || (!isProfileBootstrapPending && Boolean(profile))
  const isNavigationReady =
    fontsReady &&
    status !== 'hydrating' &&
    (isProfileBootstrapReady || isProfileBootstrapError)

  useEffect(() => {
    registerNavigationContainer(navigationContainerRef)
  }, [navigationContainerRef])

  useEffect(() => {
    if (isNavigationReady) {
      void SplashScreen.hideAsync()
    }
  }, [isNavigationReady])

  if (!isNavigationReady) {
    return null
  }

  if (isProfileBootstrapError) {
    return (
      <>
        <StatusBar style={themeName.startsWith('dark') ? 'light' : 'dark'} />
        <ScreenContainer
          contentProps={{ flex: 1, justify: 'center' }}
          testID="profile-bootstrap-error-screen"
        >
          <QueryErrorState
            onRetry={() => {
              void refetchProfileBootstrap()
            }}
            testID="profile-bootstrap-error-state"
          />
        </ScreenContainer>
      </>
    )
  }

  const hasCompletedProfileSetup = profile?.onboarding?.status === 'completed'

  return (
    <>
      <PushNotificationsObserver />
      <StatusBar style={themeName.startsWith('dark') ? 'light' : 'dark'} />
      <Stack>
        <Stack.Protected guard={!canAccessProtectedApp}>
          <Stack.Screen
            name="auth"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
        <Stack.Protected
          guard={canAccessProtectedApp && !hasCompletedProfileSetup}
        >
          <Stack.Screen
            name="setup"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
        <Stack.Protected
          guard={canAccessProtectedApp && hasCompletedProfileSetup}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="wallet"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  )
}
