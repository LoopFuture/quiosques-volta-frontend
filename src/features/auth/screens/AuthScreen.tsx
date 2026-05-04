import { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  CodeChallengeMethod,
  exchangeCodeAsync,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session'
import { LockKeyhole } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { Button, Text, XStack, YStack } from 'tamagui'
import { PrimaryButton, ScreenContainer, SurfaceCard } from '@/components/ui'
import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import {
  createKeycloakDiscoveryDocument,
  createKeycloakRedirectUri,
  getKeycloakRuntimeConfig,
} from '@/features/auth/models/config'
import { authRoutes } from '@/features/auth/routes'
import { homeRoutes } from '@/features/home/routes'
import { useOnboardingStatus } from '@/features/onboarding/hooks'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import {
  AuthActionDivider,
  AuthHeader,
  useAuthSurfaceMetrics,
} from './auth-screen-shared'

type AuthIntent = 'login' | 'register' | null

function AuthPromptScreen() {
  const { t } = useTranslation()
  const { showLogin } = useLocalSearchParams<{ showLogin?: string }>()
  const runtimeConfig = getKeycloakRuntimeConfig()
  const discovery = createKeycloakDiscoveryDocument(runtimeConfig.issuerUrl)
  const redirectUri = createKeycloakRedirectUri()
  const {
    completeSignIn,
    isBiometricUnlockEnabled,
    isAppLocked,
    isAuthenticated,
    isPinUnlockEnabled,
    signOut,
  } = useAuthSession()
  const router = useRouter()
  const { resolvedLocale, themeMode } = useAppPreferences()
  const {
    heroLogoColor,
    heroLogoSize,
    heroTitleFontSize,
    insets,
    prefersExpandedTextLayout,
    subtitleMaxWidth,
  } = useAuthSurfaceMetrics()
  const [activeIntent, setActiveIntent] = useState<AuthIntent>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isLockedSession = isAuthenticated && isAppLocked
  const shouldShowUnlockEntry =
    isLockedSession && (isBiometricUnlockEnabled || isPinUnlockEnabled)

  const authExtraParams = {
    theme: themeMode,
    ui_locales: resolvedLocale,
  }

  const [loginRequest, , promptLoginAsync] = useAuthRequest(
    {
      clientId: runtimeConfig.clientId,
      codeChallengeMethod: CodeChallengeMethod.S256,
      extraParams: authExtraParams,
      redirectUri,
      responseType: ResponseType.Code,
      scopes: runtimeConfig.scopes,
      usePKCE: true,
    },
    discovery,
  )

  const [registerRequest, , promptRegisterAsync] = useAuthRequest(
    {
      clientId: runtimeConfig.clientId,
      codeChallengeMethod: CodeChallengeMethod.S256,
      extraParams: {
        ...authExtraParams,
        prompt: 'create',
      },
      redirectUri,
      responseType: ResponseType.Code,
      scopes: runtimeConfig.scopes,
      usePKCE: true,
    },
    discovery,
  )
  const [reloginRequest, , promptReloginAsync] = useAuthRequest(
    {
      clientId: runtimeConfig.clientId,
      codeChallengeMethod: CodeChallengeMethod.S256,
      extraParams: {
        ...authExtraParams,
        prompt: 'login',
      },
      redirectUri,
      responseType: ResponseType.Code,
      scopes: runtimeConfig.scopes,
      usePKCE: true,
    },
    discovery,
  )

  const isReady = Boolean(loginRequest && registerRequest && reloginRequest)
  const isBusy = activeIntent !== null
  const actionsDisabled = !isReady || isBusy

  useEffect(() => {
    if (!shouldShowUnlockEntry || showLogin === '1') {
      return
    }

    router.replace(authRoutes.unlock)
  }, [router, shouldShowUnlockEntry, showLogin])

  async function handleAuthAction(intent: Exclude<AuthIntent, null>) {
    const isRelogin = intent === 'login' && isLockedSession
    const request =
      intent === 'login'
        ? isRelogin
          ? reloginRequest
          : loginRequest
        : registerRequest
    const promptAsync =
      intent === 'login'
        ? isRelogin
          ? promptReloginAsync
          : promptLoginAsync
        : promptRegisterAsync

    if (!request) {
      return
    }

    setActiveIntent(intent)
    setErrorMessage(null)

    const getPhaseDurationMs = createDiagnosticTimer()
    let phase: 'exchange' | 'prompt' = 'prompt'
    let getCurrentDurationMs = getPhaseDurationMs

    recordDiagnosticEvent({
      details: {
        intent,
      },
      domain: 'auth',
      operation: 'sign-in',
      phase,
      status: 'start',
      tags: {
        intent,
      },
    })

    try {
      if (isLockedSession) {
        await signOut()
      }

      const result = await promptAsync()

      if (result.type !== 'success' || !result.params.code) {
        recordDiagnosticEvent({
          details: {
            intent,
            resultType: result.type,
          },
          domain: 'auth',
          durationMs: getPhaseDurationMs(),
          operation: 'sign-in',
          phase,
          status: 'cancelled',
          tags: {
            intent,
          },
        })

        return
      }

      recordDiagnosticEvent({
        details: {
          intent,
          resultType: result.type,
        },
        domain: 'auth',
        durationMs: getPhaseDurationMs(),
        operation: 'sign-in',
        phase,
        status: 'success',
        tags: {
          intent,
        },
      })

      phase = 'exchange'
      const getExchangeDurationMs = createDiagnosticTimer()
      getCurrentDurationMs = getExchangeDurationMs

      recordDiagnosticEvent({
        details: {
          intent,
        },
        domain: 'auth',
        operation: 'sign-in',
        phase,
        status: 'start',
        tags: {
          intent,
        },
      })

      const tokenResponse = await exchangeCodeAsync(
        {
          clientId: runtimeConfig.clientId,
          code: result.params.code,
          extraParams: {
            code_verifier: request.codeVerifier ?? '',
          },
          redirectUri,
          scopes: runtimeConfig.scopes,
        },
        {
          tokenEndpoint: discovery.tokenEndpoint,
        },
      )

      await completeSignIn(tokenResponse)
      recordDiagnosticEvent({
        details: {
          intent,
        },
        domain: 'auth',
        durationMs: getExchangeDurationMs(),
        operation: 'sign-in',
        phase,
        status: 'success',
        tags: {
          intent,
        },
      })
      router.replace(homeRoutes.index)
    } catch (error) {
      recordDiagnosticEvent({
        captureError: true,
        details: {
          intent,
        },
        domain: 'auth',
        durationMs: getCurrentDurationMs(),
        error,
        operation: 'sign-in',
        phase,
        status: 'error',
        tags: {
          intent,
        },
      })
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : t('auth.errorFallback'),
      )
    } finally {
      setActiveIntent(null)
    }
  }

  return (
    <ScreenContainer
      contentProps={{ justify: 'space-between', pb: '$0' }}
      scrollable
      testID="auth-screen"
    >
      <YStack flex={1} gap="$6" pt="$8" justify="space-between">
        <YStack gap="$8">
          <AuthHeader
            description={t('auth.subtitle')}
            heroLogoColor={heroLogoColor}
            heroLogoSize={heroLogoSize}
            heroTitleFontSize={heroTitleFontSize}
            prefersExpandedTextLayout={prefersExpandedTextLayout}
            subtitleMaxWidth={subtitleMaxWidth}
            titleLeading={t('auth.titleLeading')}
            titleTrailing={t('auth.titleTrailing')}
          />
        </YStack>

        <YStack gap="$4">
          {errorMessage ? (
            <SurfaceCard
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              accessible
              bg="$red2"
              borderColor="$red8"
              gap="$2"
              rounded={24}
              testID="auth-error-text"
            >
              <Text color="$red11" fontWeight="700">
                {errorMessage}
              </Text>
            </SurfaceCard>
          ) : null}

          <PrimaryButton
            disabled={actionsDisabled}
            onPress={() => {
              void handleAuthAction('login')
            }}
            testID="auth-login-button"
          >
            {t('auth.loginLabel')}
          </PrimaryButton>

          {shouldShowUnlockEntry ? (
            <YStack gap="$4">
              <AuthActionDivider label={t('auth.dividerLabel')} />

              <PrimaryButton
                disabled={actionsDisabled}
                emphasis="outline"
                onPress={() => {
                  router.push(authRoutes.unlock)
                }}
                testID="auth-open-unlock-button"
                tone="neutral"
              >
                <XStack gap="$2" items="center" justify="center">
                  <LockKeyhole
                    color={actionsDisabled ? '$color10' : '$color11'}
                    size={18}
                  />
                  <Text
                    color={actionsDisabled ? '$color10' : '$color'}
                    fontWeight="700"
                  >
                    {t('auth.lock.openLabel')}
                  </Text>
                </XStack>
              </PrimaryButton>
            </YStack>
          ) : null}
        </YStack>

        <XStack
          gap="$2"
          items="center"
          flexWrap="wrap"
          justify="center"
          pb={Math.max(insets.bottom, 12)}
        >
          <Text color="$color11">{t('auth.registerPrompt')}</Text>
          <Button
            disabled={actionsDisabled}
            onPress={() => {
              void handleAuthAction('register')
            }}
            p={0}
            pressStyle={{ opacity: 0.75 }}
            testID="auth-register-button"
            unstyled
          >
            <Text
              color={actionsDisabled ? '$color10' : '$accent10'}
              fontWeight="800"
              opacity={actionsDisabled ? 0.65 : 1}
            >
              {t('auth.registerLabel')}
            </Text>
          </Button>
        </XStack>
      </YStack>
    </ScreenContainer>
  )
}

export default function AuthScreen() {
  const { completeOnboarding, hasCompletedOnboarding } = useOnboardingStatus()
  const { isAuthenticated } = useAuthSession()

  if (!hasCompletedOnboarding && !isAuthenticated) {
    return <OnboardingScreen onComplete={completeOnboarding} />
  }

  return <AuthPromptScreen />
}
