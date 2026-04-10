import { useCallback, useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import {
  CodeChallengeMethod,
  exchangeCodeAsync,
  ResponseType,
  useAuthRequest,
} from 'expo-auth-session'
import { Fingerprint } from '@tamagui/lucide-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Button,
  Paragraph,
  SizableText,
  Text,
  XStack,
  YStack,
  useTheme,
} from 'tamagui'
import { useTranslation } from 'react-i18next'
import {
  FormField,
  PrimaryButton,
  ScreenContainer,
  SurfaceCard,
} from '@/components/ui'
import { useDevicePrivacySettings } from '@/features/app-data/storage/device/privacy'
import AppLogo from '@/assets/images/logo.svg'
import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { APP_PIN_LENGTH, clearStoredAppPin } from '@/features/auth/pin'
import {
  createKeycloakDiscoveryDocument,
  createKeycloakRedirectUri,
  getKeycloakRuntimeConfig,
} from '@/features/auth/models/config'
import { homeRoutes } from '@/features/home/routes'
import { useOnboardingStatus } from '@/features/onboarding/hooks'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import { brandBlack } from '@/themes'

type AuthIntent = 'login' | 'register' | null

function getUnlockErrorMessage(
  reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled',
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (reason === 'not-available') {
    return t('auth.lock.notAvailableError')
  }

  if (reason === 'not-enrolled') {
    return t('auth.lock.notEnrolledError')
  }

  if (reason === 'cancelled') {
    return t('auth.lock.cancelledError')
  }

  return t('auth.lock.failedError')
}

function getPinUnlockErrorMessage(
  reason: 'failed' | 'invalid-pin' | 'not-configured' | 'too-many-attempts',
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (reason === 'invalid-pin') {
    return t('auth.lock.invalidPinError')
  }

  if (reason === 'not-configured') {
    return t('auth.lock.pinNotConfiguredError')
  }

  if (reason === 'too-many-attempts') {
    return t('auth.lock.tooManyPinAttemptsError')
  }

  return t('auth.lock.pinFailedError')
}

function useAuthSurfaceMetrics() {
  const theme = useTheme()
  const { resolvedTheme } = useAppPreferences()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360

  return {
    heroLogoColor: resolvedTheme === 'dark' ? theme.accent10.val : brandBlack,
    heroLogoSize: isCompactWidth ? 88 : 104,
    heroTitleFontSize: isCompactWidth ? 44 : 56,
    insets,
    subtitleMaxWidth: Math.max(Math.min(width - 32, 360), 240),
  }
}

function AuthHeader({
  description,
  heroLogoColor,
  heroLogoSize,
  heroTitleFontSize,
  subtitleMaxWidth,
  titleLeading,
  titleTrailing,
}: {
  description: string
  heroLogoColor: string
  heroLogoSize: number
  heroTitleFontSize: number
  subtitleMaxWidth: number
  titleLeading: string
  titleTrailing: string
}) {
  return (
    <YStack gap="$6" items="center">
      <YStack items="center" justify="center" pt={8}>
        <AppLogo
          color={heroLogoColor}
          height={heroLogoSize}
          width={heroLogoSize}
        />
      </YStack>

      <YStack gap="$3" items="center">
        <XStack gap="$2" flexWrap="wrap" justify="center">
          <Text
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
          >
            {titleLeading}
          </Text>
          <Text
            color="$accent10"
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
          >
            {titleTrailing}
          </Text>
        </XStack>

        <Paragraph
          color="$color11"
          size="$8"
          style={{ maxWidth: subtitleMaxWidth, textAlign: 'center' }}
        >
          {description}
        </Paragraph>
      </YStack>
    </YStack>
  )
}

function AuthActionDivider({ label }: { label: string }) {
  return (
    <XStack gap="$3" items="center">
      <YStack bg="$borderColor" flex={1} height={1} />
      <SizableText
        color="$color10"
        fontSize={12}
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </SizableText>
      <YStack bg="$borderColor" flex={1} height={1} />
    </XStack>
  )
}

function AuthPromptScreen() {
  const { t } = useTranslation()
  const { settings, setSettings } = useDevicePrivacySettings()
  const runtimeConfig = getKeycloakRuntimeConfig()
  const discovery = createKeycloakDiscoveryDocument(runtimeConfig.issuerUrl)
  const redirectUri = createKeycloakRedirectUri()
  const {
    appLockRevision,
    completeSignIn,
    consumePendingBiometricPrompt,
    isBiometricUnlockEnabled,
    isAppLocked,
    isAuthenticated,
    isPinUnlockEnabled,
    signOut,
    unlockWithBiometrics,
    unlockWithPin,
  } = useAuthSession()
  const router = useRouter()
  const { resolvedLocale, themeMode } = useAppPreferences()
  const {
    heroLogoColor,
    heroLogoSize,
    heroTitleFontSize,
    insets,
    subtitleMaxWidth,
  } = useAuthSurfaceMetrics()
  const lastAutoPromptedLockRevisionRef = useRef<number | null>(null)
  const [activeIntent, setActiveIntent] = useState<AuthIntent>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUnlockingBiometrics, setIsUnlockingBiometrics] = useState(false)
  const [isUnlockingPin, setIsUnlockingPin] = useState(false)
  const [pin, setPin] = useState('')
  const isLockedSession = isAuthenticated && isAppLocked

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
  const actionsDisabled =
    !isReady || isBusy || isUnlockingBiometrics || isUnlockingPin
  const canRetryBiometrics =
    isLockedSession && isBiometricUnlockEnabled && !isBusy && !isUnlockingPin
  const canRetryPin =
    isLockedSession && isPinUnlockEnabled && !isBusy && !isUnlockingBiometrics

  const handleBiometricUnlock = useCallback(async () => {
    if (!isLockedSession) {
      return
    }

    setIsUnlockingBiometrics(true)
    setErrorMessage(null)

    try {
      const result = await unlockWithBiometrics()

      if (result.success) {
        return
      }

      setErrorMessage(getUnlockErrorMessage(result.reason, t))
    } finally {
      setIsUnlockingBiometrics(false)
    }
  }, [isLockedSession, t, unlockWithBiometrics])
  const handlePinUnlock = useCallback(async () => {
    if (!isLockedSession || pin.length !== APP_PIN_LENGTH) {
      return
    }

    setIsUnlockingPin(true)
    setErrorMessage(null)

    try {
      const result = await unlockWithPin(pin)

      if (result.success) {
        setPin('')
        return
      }

      setErrorMessage(getPinUnlockErrorMessage(result.reason, t))
      if (result.reason === 'too-many-attempts') {
        setPin('')
      }
    } finally {
      setIsUnlockingPin(false)
    }
  }, [isLockedSession, pin, t, unlockWithPin])

  useEffect(() => {
    if (!isLockedSession || !isBiometricUnlockEnabled) {
      return
    }

    if (lastAutoPromptedLockRevisionRef.current === appLockRevision) {
      return
    }

    if (!consumePendingBiometricPrompt()) {
      return
    }

    lastAutoPromptedLockRevisionRef.current = appLockRevision
    void handleBiometricUnlock()
  }, [
    appLockRevision,
    consumePendingBiometricPrompt,
    handleBiometricUnlock,
    isBiometricUnlockEnabled,
    isLockedSession,
  ])

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
        if (isPinUnlockEnabled) {
          await clearStoredAppPin()
          setSettings({
            ...settings,
            pinEnabled: false,
          })
        }
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
            subtitleMaxWidth={subtitleMaxWidth}
            titleLeading={t('auth.titleLeading')}
            titleTrailing={t('auth.titleTrailing')}
          />
        </YStack>

        <YStack gap="$4">
          {errorMessage ? (
            <SurfaceCard
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

          <AuthActionDivider label={t('auth.dividerLabel')} />

          {isLockedSession ? (
            <YStack gap="$3">
              {isBiometricUnlockEnabled ? (
                <PrimaryButton
                  disabled={!canRetryBiometrics}
                  emphasis="outline"
                  isPending={isUnlockingBiometrics}
                  onPress={() => {
                    void handleBiometricUnlock()
                  }}
                  testID="auth-biometric-button"
                  tone="neutral"
                >
                  <XStack gap="$2" items="center" justify="center">
                    <Fingerprint
                      color={canRetryBiometrics ? '$accent11' : '$color10'}
                      size={18}
                    />
                    <Text
                      color={canRetryBiometrics ? '$color' : '$color10'}
                      fontWeight="700"
                    >
                      {t('auth.biometricLabel')}
                    </Text>
                  </XStack>
                </PrimaryButton>
              ) : null}

              {isPinUnlockEnabled ? (
                <YStack gap="$3">
                  <FormField
                    accessibilityLabel={t('auth.lock.pinLabel')}
                    helperText={t('auth.lock.pinHelper')}
                    keyboardType="number-pad"
                    label={t('auth.lock.pinLabel')}
                    maxLength={APP_PIN_LENGTH}
                    onChangeText={(value) => {
                      setPin(value.replace(/\D/g, '').slice(0, APP_PIN_LENGTH))
                      if (errorMessage) {
                        setErrorMessage(null)
                      }
                    }}
                    secureTextEntry
                    testID="auth-pin-input"
                    textContentType="oneTimeCode"
                    value={pin}
                  />
                  <PrimaryButton
                    disabled={!canRetryPin || pin.length !== APP_PIN_LENGTH}
                    emphasis="outline"
                    isPending={isUnlockingPin}
                    onPress={() => {
                      void handlePinUnlock()
                    }}
                    testID="auth-pin-button"
                    tone="neutral"
                  >
                    {t('auth.lock.unlockWithPinLabel')}
                  </PrimaryButton>
                </YStack>
              ) : null}
            </YStack>
          ) : (
            <PrimaryButton
              disabled
              emphasis="outline"
              testID="auth-biometric-button"
              tone="neutral"
            >
              <XStack gap="$2" items="center" justify="center">
                <Fingerprint color="$color10" size={18} />
                <Text color="$color10" fontWeight="700">
                  {t('auth.biometricLabel')}
                </Text>
              </XStack>
            </PrimaryButton>
          )}
        </YStack>

        <XStack
          gap="$2"
          items="center"
          flexWrap="wrap"
          justify="center"
          pb={Math.max(insets.bottom, 12)}
        >
          <Paragraph color="$color11">{t('auth.registerPrompt')}</Paragraph>
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
