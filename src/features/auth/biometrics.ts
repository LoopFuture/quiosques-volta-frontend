import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'

export type BiometricAvailabilityResult =
  | {
      isAvailable: true
    }
  | {
      isAvailable: false
      reason: 'not-available' | 'not-enrolled'
    }

export type BiometricAuthenticationResult =
  | {
      success: true
    }
  | {
      errorCode?: string
      reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled'
      success: false
    }

export function createBiometricPromptOptions({
  cancelLabel,
  promptMessage,
}: {
  cancelLabel: string
  promptMessage: string
}) {
  return {
    cancelLabel,
    disableDeviceFallback: true,
    fallbackLabel: Platform.OS === 'ios' ? '' : undefined,
    promptMessage,
  } as const
}

export async function getBiometricAvailability(): Promise<BiometricAvailabilityResult> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])

  if (!hasHardware) {
    return {
      isAvailable: false,
      reason: 'not-available',
    }
  }

  if (!isEnrolled) {
    return {
      isAvailable: false,
      reason: 'not-enrolled',
    }
  }

  return {
    isAvailable: true,
  }
}

export async function authenticateWithBiometrics({
  cancelLabel,
  promptMessage,
}: {
  cancelLabel: string
  promptMessage: string
}) {
  return LocalAuthentication.authenticateAsync(
    createBiometricPromptOptions({
      cancelLabel,
      promptMessage,
    }),
  )
}

export async function authenticateWithAvailableBiometrics({
  cancelLabel,
  promptMessage,
}: {
  cancelLabel: string
  promptMessage: string
}): Promise<BiometricAuthenticationResult> {
  const availability = await getBiometricAvailability()

  if (!availability.isAvailable) {
    return {
      reason: availability.reason,
      success: false,
    }
  }

  const result = await authenticateWithBiometrics({
    cancelLabel,
    promptMessage,
  })

  if (result.success) {
    return {
      success: true,
    }
  }

  return {
    errorCode: result.error,
    reason:
      result.error === 'user_cancel' ||
      result.error === 'app_cancel' ||
      result.error === 'system_cancel'
        ? 'cancelled'
        : 'failed',
    success: false,
  }
}

export function useBiometricHardwareAvailability() {
  const [hasHardware, setHasHardware] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    void LocalAuthentication.hasHardwareAsync()
      .then((value) => {
        if (isMounted) {
          setHasHardware(value)
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasHardware(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return hasHardware
}
