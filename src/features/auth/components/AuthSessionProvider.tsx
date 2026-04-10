import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { refreshAsync, type TokenResponse } from 'expo-auth-session'
import { useTranslation } from 'react-i18next'
import {
  clearStoredInitialBiometricLockBypass,
  consumeStoredInitialBiometricLockBypass,
  markNextInitialBiometricLockToBeSkipped,
} from '@/features/app-data/storage/device/auth'
import {
  isDeviceProtectionEnabled,
  useDevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import {
  createDiagnosticTimer,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import {
  authenticateWithAvailableBiometrics,
  getBiometricHardwareAvailability,
} from '@/features/auth/biometrics'
import {
  createKeycloakDiscoveryDocument,
  getKeycloakRuntimeConfig,
} from '@/features/auth/models/config'
import {
  createStoredAuthSession,
  isStoredAuthSessionFresh,
  mergeStoredAuthSession,
  toAppAuthSession,
  type AppAuthSession,
  type AuthSessionStatus,
  type StoredAuthSession,
} from '@/features/auth/models/session'
import {
  getAuthSessionIdentity,
  type AppAuthIdentity,
} from '@/features/auth/models/identity'
import { setCurrentAuthAccessToken } from '@/features/auth/runtime'
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  saveStoredAuthSession,
} from '@/features/auth/storage'
import {
  clearStoredAppPin,
  hasStoredAppPin,
  verifyStoredAppPin,
} from '@/features/auth/pin'

export type BiometricUnlockResult =
  | {
      success: true
    }
  | {
      errorCode?: string
      reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled'
      success: false
    }

export type PinUnlockResult =
  | {
      success: true
    }
  | {
      reason: 'failed' | 'invalid-pin' | 'not-configured' | 'too-many-attempts'
      success: false
    }

export type AuthSessionContextValue = {
  appLockRevision: number
  canAccessProtectedApp: boolean
  completeSignIn: (tokenResponse: TokenResponse) => Promise<void>
  consumePendingBiometricPrompt: () => boolean
  identity: AppAuthIdentity | null
  isBiometricUnlockEnabled: boolean
  isAppLocked: boolean
  isAuthenticated: boolean
  isPinUnlockEnabled: boolean
  session: AppAuthSession | null
  signOut: () => Promise<void>
  status: AuthSessionStatus
  unlockWithBiometrics: () => Promise<BiometricUnlockResult>
  unlockWithPin: (pin: string) => Promise<PinUnlockResult>
}
export const AuthSessionContext = createContext<AuthSessionContextValue | null>(
  null,
)
type AuthSessionProviderProps = {
  children: ReactNode
  onSessionCleared?: () => void | Promise<void>
}

const MAX_PIN_UNLOCK_ATTEMPTS = 5

function describeStoredSession(session: StoredAuthSession | null | undefined) {
  return {
    expiresIn: session?.expiresIn ?? null,
    hasAccessToken: Boolean(session?.accessToken),
    hasIdToken: Boolean(session?.idToken),
    hasRefreshToken: Boolean(session?.refreshToken),
    issuedAt: session?.issuedAt ?? null,
    scope: session?.scope ?? null,
    tokenType: session?.tokenType ?? null,
  }
}

export function AuthSessionProvider({
  children,
  onSessionCleared,
}: AuthSessionProviderProps) {
  const { t } = useTranslation()
  const { settings, setSettings } = useDevicePrivacySettings()
  const runtimeConfig = getKeycloakRuntimeConfig()
  const discovery = createKeycloakDiscoveryDocument(runtimeConfig.issuerUrl)
  const [status, setStatus] = useState<AuthSessionStatus>('hydrating')
  const [session, setSession] = useState<AppAuthSession | null>(null)
  const [isAppLocked, setIsAppLocked] = useState(false)
  const [hasBiometricHardware, setHasBiometricHardware] = useState<
    boolean | null
  >(null)
  const [hasStoredPinCredential, setHasStoredPinCredential] = useState<
    boolean | null
  >(null)
  const [appLockRevision, setAppLockRevision] = useState(0)
  const appLockRef = useRef(false)
  const isMountedRef = useRef(false)
  const hasHydratedSessionRef = useRef(false)
  const pendingBiometricPromptRef = useRef(false)
  const pinUnlockAttemptsRef = useRef(0)
  const storedSessionRef = useRef<StoredAuthSession | null>(null)
  const reconcileLocalProtectionSettings = useCallback(
    async (currentSettings = settings) => {
      const [resolvedHasBiometricHardware, resolvedHasStoredPinCredential] =
        await Promise.all([
          currentSettings.biometricsEnabled
            ? getBiometricHardwareAvailability().catch(() => false)
            : Promise.resolve(hasBiometricHardware),
          currentSettings.pinEnabled
            ? hasStoredAppPin().catch(() => false)
            : Promise.resolve(false),
        ])

      if (isMountedRef.current) {
        if (typeof resolvedHasBiometricHardware === 'boolean') {
          setHasBiometricHardware(resolvedHasBiometricHardware)
        }

        setHasStoredPinCredential(resolvedHasStoredPinCredential)
      }

      const nextSettings = {
        ...currentSettings,
        biometricsEnabled:
          currentSettings.biometricsEnabled &&
          resolvedHasBiometricHardware === true,
        pinEnabled:
          currentSettings.pinEnabled && resolvedHasStoredPinCredential === true,
      }

      if (
        nextSettings.biometricsEnabled !== currentSettings.biometricsEnabled ||
        nextSettings.pinEnabled !== currentSettings.pinEnabled
      ) {
        setSettings(nextSettings)
      }

      return nextSettings
    },
    [hasBiometricHardware, setSettings, settings],
  )
  const isBiometricUnlockEnabled =
    settings.biometricsEnabled && hasBiometricHardware === true
  const isPinUnlockEnabled =
    settings.pinEnabled && hasStoredPinCredential === true
  const hasLocalProtection = isBiometricUnlockEnabled || isPinUnlockEnabled
  const setAppLockState = useCallback((nextValue: boolean) => {
    if (nextValue && !appLockRef.current) {
      setAppLockRevision((currentValue) => currentValue + 1)
      pendingBiometricPromptRef.current = true
      pinUnlockAttemptsRef.current = 0
    }

    if (!nextValue) {
      pendingBiometricPromptRef.current = false
      pinUnlockAttemptsRef.current = 0
    }

    appLockRef.current = nextValue
    setIsAppLocked(nextValue)
  }, [])
  const consumePendingBiometricPrompt = useCallback(() => {
    if (!pendingBiometricPromptRef.current) {
      return false
    }

    pendingBiometricPromptRef.current = false
    return true
  }, [])
  const setAuthenticatedSession = useCallback(
    (nextSession: StoredAuthSession, options: { lockApp?: boolean } = {}) => {
      storedSessionRef.current = nextSession
      setCurrentAuthAccessToken(nextSession.accessToken)
      setSession(toAppAuthSession(nextSession))
      setStatus('authenticated')
      if (typeof options.lockApp === 'boolean') {
        setAppLockState(options.lockApp)
      }
    },
    [setAppLockState],
  )
  const clearSessionState = useCallback(() => {
    storedSessionRef.current = null
    setCurrentAuthAccessToken(null)
    setSession(null)
    setStatus('anonymous')
    setAppLockState(false)
  }, [setAppLockState])
  const clearSessionArtifacts = useCallback(async () => {
    storedSessionRef.current = null
    clearStoredInitialBiometricLockBypass()
    await clearStoredAuthSession()
    try {
      await onSessionCleared?.()
    } catch (error) {
      recordDiagnosticEvent({
        captureError: true,
        details: {
          reason: 'on-session-cleared-callback-failed',
        },
        domain: 'auth',
        error,
        operation: 'session',
        phase: 'clear-artifacts',
        status: 'error',
      })

      // Sign-out should not fail if local cache cleanup throws unexpectedly.
    }
  }, [onSessionCleared])
  const clearSessionArtifactsRef = useRef(clearSessionArtifacts)
  const clearSessionStateRef = useRef(clearSessionState)
  const setAuthenticatedSessionRef = useRef(setAuthenticatedSession)

  useEffect(() => {
    clearSessionArtifactsRef.current = clearSessionArtifacts
  }, [clearSessionArtifacts])

  useEffect(() => {
    clearSessionStateRef.current = clearSessionState
  }, [clearSessionState])

  useEffect(() => {
    setAuthenticatedSessionRef.current = setAuthenticatedSession
  }, [setAuthenticatedSession])
  const completeSignIn = useCallback(
    async (tokenResponse: TokenResponse) => {
      const nextSession = createStoredAuthSession(tokenResponse)
      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        details: describeStoredSession(nextSession),
        domain: 'auth',
        operation: 'sign-in',
        phase: 'persist-session',
        status: 'start',
      })

      try {
        markNextInitialBiometricLockToBeSkipped()
        await saveStoredAuthSession(nextSession)
        setAuthenticatedSession(nextSession, {
          lockApp: false,
        })
        recordDiagnosticEvent({
          details: describeStoredSession(nextSession),
          domain: 'auth',
          durationMs: getDurationMs(),
          operation: 'sign-in',
          phase: 'persist-session',
          status: 'success',
        })
      } catch (error) {
        recordDiagnosticEvent({
          captureError: true,
          details: describeStoredSession(nextSession),
          domain: 'auth',
          durationMs: getDurationMs(),
          error,
          operation: 'sign-in',
          phase: 'persist-session',
          status: 'error',
        })

        clearStoredInitialBiometricLockBypass()
        throw error
      }
    },
    [setAuthenticatedSession],
  )
  const signOutFromKeycloak = useCallback(
    async (currentSession: StoredAuthSession | null) => {
      const endSessionEndpoint = discovery.endSessionEndpoint

      if (!endSessionEndpoint || !currentSession?.refreshToken) {
        return false
      }

      const response = await fetch(endSessionEndpoint, {
        body: new URLSearchParams({
          client_id: runtimeConfig.clientId,
          refresh_token: currentSession.refreshToken,
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(
          `Keycloak logout failed with status ${response.status}.`,
        )
      }

      return true
    },
    [discovery.endSessionEndpoint, runtimeConfig.clientId],
  )
  const signOut = useCallback(async () => {
    const currentSession = storedSessionRef.current
    const getRemoteLogoutDurationMs = createDiagnosticTimer()

    recordDiagnosticEvent({
      details: describeStoredSession(currentSession),
      domain: 'auth',
      operation: 'sign-out',
      phase: 'remote-logout',
      status: 'start',
    })

    try {
      const attemptedRemoteLogout = await signOutFromKeycloak(currentSession)

      recordDiagnosticEvent({
        details: {
          ...describeStoredSession(currentSession),
          attemptedRemoteLogout,
        },
        domain: 'auth',
        durationMs: getRemoteLogoutDurationMs(),
        operation: 'sign-out',
        phase: 'remote-logout',
        status: attemptedRemoteLogout ? 'success' : 'info',
      })
    } catch (error) {
      recordDiagnosticEvent({
        captureError: true,
        details: describeStoredSession(currentSession),
        domain: 'auth',
        durationMs: getRemoteLogoutDurationMs(),
        error,
        operation: 'sign-out',
        phase: 'remote-logout',
        status: 'error',
      })

      // Local sign-out must still complete if the remote logout flow fails.
    } finally {
      const getClearDurationMs = createDiagnosticTimer()

      await clearSessionArtifacts()
      clearSessionState()
      recordDiagnosticEvent({
        details: describeStoredSession(currentSession),
        domain: 'auth',
        durationMs: getClearDurationMs(),
        operation: 'sign-out',
        phase: 'clear-local-session',
        status: 'success',
      })
    }
  }, [clearSessionArtifacts, clearSessionState, signOutFromKeycloak])
  const refreshStoredSession = useCallback(
    async (
      currentSession: StoredAuthSession,
      options: { lockApp?: boolean } = {},
    ) => {
      if (!currentSession.refreshToken) {
        throw new Error('Cannot refresh a session without a refresh token.')
      }
      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        details: describeStoredSession(currentSession),
        domain: 'auth',
        operation: 'session-refresh',
        phase: 'refresh',
        status: 'start',
      })

      try {
        const refreshedTokenResponse = await refreshAsync(
          {
            clientId: runtimeConfig.clientId,
            refreshToken: currentSession.refreshToken,
            scopes: runtimeConfig.scopes,
          },
          {
            tokenEndpoint: discovery.tokenEndpoint,
          },
        )
        const nextSession = mergeStoredAuthSession(
          currentSession,
          refreshedTokenResponse,
        )

        await saveStoredAuthSession(nextSession)
        setAuthenticatedSession(nextSession, {
          lockApp: options.lockApp ?? appLockRef.current,
        })
        recordDiagnosticEvent({
          details: describeStoredSession(nextSession),
          domain: 'auth',
          durationMs: getDurationMs(),
          operation: 'session-refresh',
          phase: 'refresh',
          status: 'success',
        })

        return nextSession
      } catch (error) {
        recordDiagnosticEvent({
          captureError: true,
          details: describeStoredSession(currentSession),
          domain: 'auth',
          durationMs: getDurationMs(),
          error,
          operation: 'session-refresh',
          phase: 'refresh',
          status: 'error',
        })

        throw error
      }
    },
    [
      discovery.tokenEndpoint,
      runtimeConfig.clientId,
      runtimeConfig.scopes,
      setAuthenticatedSession,
    ],
  )
  const refreshStoredSessionRef = useRef(refreshStoredSession)

  useEffect(() => {
    refreshStoredSessionRef.current = refreshStoredSession
  }, [refreshStoredSession])
  const unlockWithBiometrics =
    useCallback(async (): Promise<BiometricUnlockResult> => {
      if (!storedSessionRef.current) {
        return {
          reason: 'failed',
          success: false,
        }
      }

      if (!isBiometricUnlockEnabled) {
        return {
          reason: 'not-available',
          success: false,
        }
      }

      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        domain: 'auth',
        operation: 'app-lock',
        phase: 'unlock',
        status: 'start',
      })

      try {
        const result = await authenticateWithAvailableBiometrics({
          cancelLabel: t('auth.lock.cancelLabel'),
          promptMessage: t('auth.lock.promptMessage'),
        })

        if (result.success) {
          setAppLockState(false)
          recordDiagnosticEvent({
            domain: 'auth',
            durationMs: getDurationMs(),
            operation: 'app-lock',
            phase: 'unlock',
            status: 'success',
          })

          return {
            success: true,
          }
        }

        recordDiagnosticEvent({
          details: {
            errorCode: result.errorCode,
            reason: result.reason,
          },
          domain: 'auth',
          durationMs: getDurationMs(),
          operation: 'app-lock',
          phase: 'unlock',
          status: 'info',
        })

        return {
          errorCode: result.errorCode,
          reason: result.reason,
          success: false,
        }
      } catch (error) {
        recordDiagnosticEvent({
          captureError: true,
          domain: 'auth',
          durationMs: getDurationMs(),
          error,
          operation: 'app-lock',
          phase: 'unlock',
          status: 'error',
        })

        return {
          reason: 'failed',
          success: false,
        }
      }
    }, [isBiometricUnlockEnabled, setAppLockState, t])
  const unlockWithPin = useCallback(
    async (pin: string): Promise<PinUnlockResult> => {
      if (!storedSessionRef.current) {
        return {
          reason: 'failed',
          success: false,
        }
      }

      if (!isPinUnlockEnabled) {
        return {
          reason: 'not-configured',
          success: false,
        }
      }

      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        details: {
          method: 'pin',
        },
        domain: 'auth',
        operation: 'app-lock',
        phase: 'unlock',
        status: 'start',
      })

      try {
        const isPinValid = await verifyStoredAppPin(pin)

        if (isPinValid) {
          setAppLockState(false)
          recordDiagnosticEvent({
            details: {
              method: 'pin',
            },
            domain: 'auth',
            durationMs: getDurationMs(),
            operation: 'app-lock',
            phase: 'unlock',
            status: 'success',
          })

          return {
            success: true,
          }
        }

        pinUnlockAttemptsRef.current += 1

        if (pinUnlockAttemptsRef.current >= MAX_PIN_UNLOCK_ATTEMPTS) {
          await clearStoredAppPin()
          setSettings({
            ...settings,
            pinEnabled: false,
          })
          await signOut()
          recordDiagnosticEvent({
            details: {
              attempts: pinUnlockAttemptsRef.current,
              method: 'pin',
              reason: 'too-many-attempts',
            },
            domain: 'auth',
            durationMs: getDurationMs(),
            operation: 'app-lock',
            phase: 'unlock',
            status: 'info',
          })

          return {
            reason: 'too-many-attempts',
            success: false,
          }
        }

        recordDiagnosticEvent({
          details: {
            attempts: pinUnlockAttemptsRef.current,
            method: 'pin',
            reason: 'invalid-pin',
          },
          domain: 'auth',
          durationMs: getDurationMs(),
          operation: 'app-lock',
          phase: 'unlock',
          status: 'info',
        })

        return {
          reason: 'invalid-pin',
          success: false,
        }
      } catch (error) {
        recordDiagnosticEvent({
          captureError: true,
          details: {
            method: 'pin',
          },
          domain: 'auth',
          durationMs: getDurationMs(),
          error,
          operation: 'app-lock',
          phase: 'unlock',
          status: 'error',
        })

        return {
          reason: 'failed',
          success: false,
        }
      }
    },
    [isPinUnlockEnabled, setAppLockState, setSettings, settings, signOut],
  )
  const refreshSessionIfNeeded = useCallback(
    async ({
      allowRefreshingStatus,
      currentSession,
      lockAppOnSuccess,
    }: {
      allowRefreshingStatus: boolean
      currentSession?: StoredAuthSession | null
      lockAppOnSuccess?: boolean
    }) => {
      const resolvedSession = currentSession ?? storedSessionRef.current
      if (!resolvedSession) {
        return
      }
      if (isStoredAuthSessionFresh(resolvedSession)) {
        if (!session) {
          setAuthenticatedSession(resolvedSession)
        }
        return
      }
      if (!resolvedSession.refreshToken) {
        recordDiagnosticEvent({
          details: {
            ...describeStoredSession(resolvedSession),
            reason: 'missing-refresh-token',
          },
          domain: 'auth',
          operation: 'session-refresh',
          phase: 'refresh',
          status: 'info',
        })
        await clearSessionArtifacts()
        clearSessionState()
        return
      }
      if (allowRefreshingStatus) {
        setStatus('refreshing')
      }
      try {
        await refreshStoredSession(resolvedSession, {
          lockApp: lockAppOnSuccess,
        })
      } catch {
        await clearSessionArtifacts()
        clearSessionState()
        recordDiagnosticEvent({
          details: {
            ...describeStoredSession(resolvedSession),
            reason: 'cleared-after-refresh-failure',
          },
          domain: 'auth',
          operation: 'session-refresh',
          phase: 'refresh',
          status: 'info',
        })
      }
    },
    [
      clearSessionArtifacts,
      clearSessionState,
      refreshStoredSession,
      session,
      setAuthenticatedSession,
    ],
  )
  useEffect(() => {
    if (!session || !hasLocalProtection) {
      setAppLockState(false)
    }
  }, [hasLocalProtection, session, setAppLockState])
  useEffect(() => {
    isMountedRef.current = true

    void reconcileLocalProtectionSettings()

    return () => {
      isMountedRef.current = false
    }
  }, [reconcileLocalProtectionSettings])
  useEffect(() => {
    if (hasHydratedSessionRef.current) {
      return
    }

    hasHydratedSessionRef.current = true

    async function hydrateSession() {
      const getDurationMs = createDiagnosticTimer()

      recordDiagnosticEvent({
        domain: 'auth',
        operation: 'session',
        phase: 'hydrate',
        status: 'start',
      })

      try {
        const nextLocalProtectionSettings =
          await reconcileLocalProtectionSettings()
        const shouldLockOnHydrate =
          isDeviceProtectionEnabled(nextLocalProtectionSettings) &&
          !consumeStoredInitialBiometricLockBypass()
        const storedSession = await readStoredAuthSession()
        if (!isMountedRef.current || !storedSession) {
          if (isMountedRef.current) {
            clearSessionStateRef.current()
            recordDiagnosticEvent({
              details: {
                result: 'anonymous',
              },
              domain: 'auth',
              durationMs: getDurationMs(),
              operation: 'session',
              phase: 'hydrate',
              status: 'success',
            })
          }
          return
        }
        storedSessionRef.current = storedSession
        if (isStoredAuthSessionFresh(storedSession)) {
          setAuthenticatedSessionRef.current(storedSession, {
            lockApp: shouldLockOnHydrate,
          })
          recordDiagnosticEvent({
            details: {
              result: 'restored',
              session: describeStoredSession(storedSession),
            },
            domain: 'auth',
            durationMs: getDurationMs(),
            operation: 'session',
            phase: 'hydrate',
            status: 'success',
          })
          return
        }
        try {
          const nextSession = await refreshStoredSessionRef.current(
            storedSession,
            {
              lockApp: shouldLockOnHydrate,
            },
          )
          if (!isMountedRef.current) {
            return
          }
          storedSessionRef.current = nextSession
          recordDiagnosticEvent({
            details: {
              result: 'refreshed',
              session: describeStoredSession(nextSession),
            },
            domain: 'auth',
            durationMs: getDurationMs(),
            operation: 'session',
            phase: 'hydrate',
            status: 'success',
          })
        } catch {
          await clearSessionArtifactsRef.current()
          if (isMountedRef.current) {
            clearSessionStateRef.current()
            recordDiagnosticEvent({
              details: {
                result: 'cleared-after-refresh-failure',
              },
              domain: 'auth',
              durationMs: getDurationMs(),
              operation: 'session',
              phase: 'hydrate',
              status: 'info',
            })
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          clearSessionStateRef.current()
        }
        recordDiagnosticEvent({
          captureError: true,
          domain: 'auth',
          durationMs: getDurationMs(),
          error,
          operation: 'session',
          phase: 'hydrate',
          status: 'error',
        })
      }
    }
    void hydrateSession()
  }, [reconcileLocalProtectionSettings])
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState !== 'active') {
          return
        }

        void refreshSessionIfNeeded({
          allowRefreshingStatus: true,
          lockAppOnSuccess: appLockRef.current,
        })
      },
    )
    return () => {
      subscription.remove()
    }
  }, [refreshSessionIfNeeded])
  const canAccessProtectedApp =
    Boolean(session) && (!hasLocalProtection || !isAppLocked)
  const value = useMemo<AuthSessionContextValue>(
    () => ({
      appLockRevision,
      canAccessProtectedApp,
      completeSignIn,
      consumePendingBiometricPrompt,
      identity: getAuthSessionIdentity(session),
      isBiometricUnlockEnabled,
      isAppLocked,
      isAuthenticated: Boolean(session),
      isPinUnlockEnabled,
      session,
      signOut,
      status,
      unlockWithBiometrics,
      unlockWithPin,
    }),
    [
      appLockRevision,
      canAccessProtectedApp,
      completeSignIn,
      consumePendingBiometricPrompt,
      isBiometricUnlockEnabled,
      isAppLocked,
      isPinUnlockEnabled,
      session,
      signOut,
      status,
      unlockWithBiometrics,
      unlockWithPin,
    ],
  )
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}
