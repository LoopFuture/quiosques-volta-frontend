import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { Delete, Fingerprint, X } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { Button, Text, XStack, YStack } from 'tamagui'
import { PrimaryButton, ScreenContainer, SurfaceCard } from '@/components/ui'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { APP_PIN_LENGTH } from '@/features/auth/pin'
import { authRoutes } from '@/features/auth/routes'
import {
  getPinUnlockErrorMessage,
  getUnlockErrorMessage,
} from './auth-screen-shared'

const PIN_PAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['biometric', '0', 'delete'],
] as const

type UnlockErrorState =
  | {
      kind: 'biometric'
      reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled'
    }
  | {
      kind: 'pin'
      reason: 'failed' | 'invalid-pin' | 'not-configured' | 'too-many-attempts'
    }

function PinDot({
  accessibilityLabel,
  filled,
  isError,
  testID,
}: {
  accessibilityLabel: string
  filled: boolean
  isError: boolean
  testID: string
}) {
  const dotColor = isError ? '$red9' : filled ? '$accent9' : '$color5'
  const borderColor = isError ? '$red9' : filled ? '$accent9' : '$color7'

  return (
    <YStack
      accessibilityLabel={accessibilityLabel}
      bg={dotColor}
      borderColor={borderColor}
      borderWidth={1}
      height={14}
      rounded={999}
      testID={testID}
      width={14}
    />
  )
}

export default function UnlockScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    appLockRevision,
    consumePendingBiometricPrompt,
    isAppLocked,
    isAuthenticated,
    isBiometricUnlockEnabled,
    isPinUnlockEnabled,
    unlockWithBiometrics,
    unlockWithPin,
  } = useAuthSession()
  const { fontScale, height, width } = useWindowDimensions()
  const lastAutoPromptedLockRevisionRef = useRef<number | null>(null)
  const pinValueRef = useRef('')
  const pinFailureResetTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const pinDotsShake = useRef(new Animated.Value(0)).current
  const [hasPinFailureFeedback, setHasPinFailureFeedback] = useState(false)
  const [hasBiometricUnavailableError, setHasBiometricUnavailableError] =
    useState(false)
  const [isUnlockingBiometrics, setIsUnlockingBiometrics] = useState(false)
  const [isUnlockingPin, setIsUnlockingPin] = useState(false)
  const [unlockError, setUnlockError] = useState<UnlockErrorState | null>(null)
  const [pin, setPin] = useState('')
  const isLockedSession = isAuthenticated && isAppLocked
  const prefersExpandedTextLayout = fontScale > 1.15
  const isShortHeight = height < 780 || prefersExpandedTextLayout
  const isVeryShortHeight = height < 700 || fontScale > 1.3
  const isCompactWidth = width < 360 || prefersExpandedTextLayout
  const cardGap = isVeryShortHeight ? '$3' : '$4'
  const keypadGap = isVeryShortHeight ? '$2.5' : '$3'
  const closeButtonSize = isVeryShortHeight ? '$3.5' : '$4'
  const keypadButtonSize =
    isVeryShortHeight || isCompactWidth ? 60 : isShortHeight ? 66 : 72
  const cardPadding = isVeryShortHeight ? '$4' : '$5'
  const titleSize = isVeryShortHeight || isCompactWidth ? 24 : 28
  const cardMaxWidth = Math.min(width - 32, 360)
  const hasPinBlockingError =
    unlockError?.kind === 'pin' &&
    (unlockError.reason === 'not-configured' ||
      unlockError.reason === 'too-many-attempts')
  const currentErrorMessage = unlockError
    ? unlockError.kind === 'biometric'
      ? getUnlockErrorMessage(unlockError.reason, t)
      : hasPinBlockingError
        ? getPinUnlockErrorMessage(unlockError.reason, t)
        : null
    : null
  const getPinDotAccessibilityLabel = useCallback(
    (index: number, filled: boolean, isError: boolean) => {
      if (isError) {
        return t('auth.lock.pinProgressError', {
          currentDigit: index,
          totalDigits: APP_PIN_LENGTH,
        })
      }

      if (filled) {
        return t('auth.lock.pinProgressEntered', {
          currentDigit: index,
          totalDigits: APP_PIN_LENGTH,
        })
      }

      return t('auth.lock.pinProgressEmpty', {
        currentDigit: index,
        totalDigits: APP_PIN_LENGTH,
      })
    },
    [t],
  )
  useEffect(() => {
    if (!isLockedSession) {
      router.replace(authRoutes.index)
    }
  }, [isLockedSession, router])

  useEffect(() => {
    return () => {
      if (pinFailureResetTimeoutRef.current) {
        clearTimeout(pinFailureResetTimeoutRef.current)
      }
    }
  }, [])

  const triggerPinFailureFeedback = useCallback(() => {
    setHasPinFailureFeedback(true)
    pinDotsShake.stopAnimation()
    pinDotsShake.setValue(0)
    Animated.sequence([
      Animated.timing(pinDotsShake, {
        duration: 50,
        easing: Easing.linear,
        toValue: 10,
        useNativeDriver: true,
      }),
      Animated.timing(pinDotsShake, {
        duration: 50,
        easing: Easing.linear,
        toValue: -10,
        useNativeDriver: true,
      }),
      Animated.timing(pinDotsShake, {
        duration: 50,
        easing: Easing.linear,
        toValue: 8,
        useNativeDriver: true,
      }),
      Animated.timing(pinDotsShake, {
        duration: 50,
        easing: Easing.linear,
        toValue: -8,
        useNativeDriver: true,
      }),
      Animated.timing(pinDotsShake, {
        duration: 45,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start()

    if (pinFailureResetTimeoutRef.current) {
      clearTimeout(pinFailureResetTimeoutRef.current)
    }

    pinFailureResetTimeoutRef.current = setTimeout(() => {
      setHasPinFailureFeedback(false)
    }, 520)
  }, [pinDotsShake])

  const handleBiometricUnlock = useCallback(async () => {
    if (!isLockedSession || hasBiometricUnavailableError) {
      return
    }

    setIsUnlockingBiometrics(true)
    setUnlockError(null)

    try {
      const result = await unlockWithBiometrics()

      if (result.success) {
        return
      }

      if (
        result.reason === 'not-available' ||
        result.reason === 'not-enrolled'
      ) {
        setHasBiometricUnavailableError(true)
      }

      setUnlockError({
        kind: 'biometric',
        reason: result.reason,
      })
    } finally {
      setIsUnlockingBiometrics(false)
    }
  }, [hasBiometricUnavailableError, isLockedSession, unlockWithBiometrics])

  const submitPin = useCallback(
    async (currentPin: string) => {
      if (!isLockedSession || currentPin.length !== APP_PIN_LENGTH) {
        return
      }

      setIsUnlockingPin(true)
      setUnlockError(null)

      try {
        const result = await unlockWithPin(currentPin)

        if (result.success) {
          pinValueRef.current = ''
          setPin('')
          return
        }

        triggerPinFailureFeedback()
        pinValueRef.current = ''
        setPin('')
        setUnlockError({
          kind: 'pin',
          reason: result.reason,
        })
      } finally {
        setIsUnlockingPin(false)
      }
    },
    [isLockedSession, triggerPinFailureFeedback, unlockWithPin],
  )

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

  const appendDigit = useCallback(
    (digit: string) => {
      if (isUnlockingPin || isUnlockingBiometrics) {
        return
      }

      if (pinValueRef.current.length >= APP_PIN_LENGTH) {
        return
      }

      const nextPin = `${pinValueRef.current}${digit}`.slice(0, APP_PIN_LENGTH)
      pinValueRef.current = nextPin
      setPin(nextPin)
      setHasPinFailureFeedback(false)
      setUnlockError(null)

      if (nextPin.length === APP_PIN_LENGTH) {
        void submitPin(nextPin)
      }
    },
    [isUnlockingBiometrics, isUnlockingPin, submitPin],
  )

  const removeDigit = useCallback(() => {
    if (
      isUnlockingPin ||
      isUnlockingBiometrics ||
      pinValueRef.current.length === 0
    ) {
      return
    }

    pinValueRef.current = pinValueRef.current.slice(0, -1)
    setPin(pinValueRef.current)
    setHasPinFailureFeedback(false)
    setUnlockError(null)
  }, [isUnlockingBiometrics, isUnlockingPin])

  const handleClose = useCallback(() => {
    router.replace({
      params: {
        showLogin: '1',
      },
      pathname: authRoutes.index,
    })
  }, [router])

  const canUseBiometrics =
    isBiometricUnlockEnabled &&
    !hasBiometricUnavailableError &&
    !isUnlockingPin &&
    !isUnlockingBiometrics
  const canUsePin =
    isPinUnlockEnabled &&
    !hasPinBlockingError &&
    !isUnlockingPin &&
    !isUnlockingBiometrics

  return (
    <ScreenContainer
      bottomInset
      contentProps={{ flex: 1, justify: 'flex-start', pb: '$4', pt: '$0' }}
      scrollable
      testID="auth-unlock-screen"
    >
      <YStack flex={1} gap={cardGap} justify="flex-start" py="$3">
        <XStack justify="flex-end">
          <Button
            accessibilityLabel={t('auth.lock.closeLabel')}
            bg="$color2"
            borderColor="$borderColor"
            borderWidth={1}
            circular
            onPress={handleClose}
            pressStyle={{ opacity: 0.88, scale: 0.98 }}
            size={closeButtonSize}
            testID="auth-unlock-close-button"
          >
            <X color="$color11" size={18} />
          </Button>
        </XStack>

        <SurfaceCard
          gap={cardGap}
          p={cardPadding}
          rounded={32}
          style={{ alignSelf: 'center', maxWidth: cardMaxWidth, width: '100%' }}
        >
          <YStack gap="$2" items="center">
            <Text
              fontSize={titleSize}
              fontWeight="900"
              style={{ textAlign: 'center' }}
            >
              {t('auth.lock.title')}
            </Text>
            <Text
              color="$color11"
              fontSize={16}
              style={{ textAlign: 'center' }}
            >
              {t('auth.lock.description')}
            </Text>
          </YStack>

          {currentErrorMessage ? (
            <YStack gap="$3">
              <SurfaceCard
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                accessible
                bg="$red2"
                borderColor="$red8"
                gap="$2"
                p="$3"
                rounded={24}
                testID="auth-error-text"
              >
                <Text color="$red11" fontWeight="700">
                  {currentErrorMessage}
                </Text>
              </SurfaceCard>

              <PrimaryButton
                emphasis="outline"
                onPress={handleClose}
                testID="auth-unlock-login-again-button"
                tone="neutral"
              >
                {t('auth.lock.loginAgainLabel')}
              </PrimaryButton>
            </YStack>
          ) : null}

          <Animated.View
            style={{
              transform: [
                {
                  translateX: pinDotsShake,
                },
              ],
            }}
            testID="auth-pin-dots-row"
          >
            <XStack
              gap="$3"
              justify="center"
              py={isVeryShortHeight ? '$1' : '$2'}
            >
              {Array.from({ length: APP_PIN_LENGTH }, (_, index) => (
                <PinDot
                  accessibilityLabel={getPinDotAccessibilityLabel(
                    index + 1,
                    index < pin.length,
                    hasPinFailureFeedback,
                  )}
                  filled={index < pin.length}
                  isError={hasPinFailureFeedback}
                  key={`pin-dot-${index + 1}`}
                  testID={`auth-pin-dot-${index + 1}`}
                />
              ))}
            </XStack>
          </Animated.View>

          <YStack
            gap={keypadGap}
            style={{ alignSelf: 'center', width: '100%' }}
          >
            {PIN_PAD_ROWS.map((row, rowIndex) => (
              <XStack
                gap={keypadGap}
                key={`pin-row-${rowIndex}`}
                justify="space-between"
              >
                {row.map((item) => {
                  if (item === 'biometric') {
                    return (
                      <Button
                        accessibilityLabel={t('auth.biometricLabel')}
                        accessibilityState={{
                          disabled: !canUseBiometrics,
                        }}
                        aspectRatio={1}
                        bg={canUseBiometrics ? '$accent3' : '$color2'}
                        borderColor={canUseBiometrics ? '$accent7' : '$color6'}
                        borderWidth={1}
                        disabled={!canUseBiometrics}
                        flex={1}
                        height={keypadButtonSize}
                        justify="center"
                        key={item}
                        onPress={() => {
                          void handleBiometricUnlock()
                        }}
                        pressStyle={
                          canUseBiometrics
                            ? { opacity: 0.92, scale: 0.985 }
                            : undefined
                        }
                        rounded={999}
                        testID="auth-biometric-button"
                      >
                        <Fingerprint
                          color={canUseBiometrics ? '$accent11' : '$color10'}
                          size={isVeryShortHeight ? 20 : 22}
                        />
                      </Button>
                    )
                  }

                  if (item === 'delete') {
                    return (
                      <Button
                        accessibilityLabel={t('auth.lock.deleteDigitLabel')}
                        accessibilityState={{
                          disabled: isUnlockingPin || isUnlockingBiometrics,
                        }}
                        aspectRatio={1}
                        bg="$color2"
                        borderColor="$borderColor"
                        borderWidth={1}
                        disabled={isUnlockingPin || isUnlockingBiometrics}
                        flex={1}
                        height={keypadButtonSize}
                        justify="center"
                        key={item}
                        onPress={removeDigit}
                        pressStyle={{ opacity: 0.92, scale: 0.985 }}
                        rounded={999}
                        testID="auth-pin-delete-button"
                      >
                        <Delete
                          color="$color11"
                          size={isVeryShortHeight ? 20 : 22}
                        />
                      </Button>
                    )
                  }

                  return (
                    <Button
                      accessibilityLabel={item}
                      accessibilityState={{
                        disabled: !canUsePin,
                      }}
                      aspectRatio={1}
                      bg={canUsePin ? '$color1' : '$color2'}
                      borderColor="$borderColor"
                      borderWidth={1}
                      disabled={!canUsePin}
                      flex={1}
                      height={keypadButtonSize}
                      justify="center"
                      key={item}
                      onPress={() => {
                        appendDigit(item)
                      }}
                      pressStyle={
                        canUsePin ? { opacity: 0.92, scale: 0.985 } : undefined
                      }
                      rounded={999}
                      testID={`auth-pin-key-${item}`}
                    >
                      <Text
                        color="$color12"
                        fontSize={isVeryShortHeight ? 22 : 24}
                        fontWeight="800"
                      >
                        {item}
                      </Text>
                    </Button>
                  )
                })}
              </XStack>
            ))}
          </YStack>
        </SurfaceCard>
      </YStack>
    </ScreenContainer>
  )
}
