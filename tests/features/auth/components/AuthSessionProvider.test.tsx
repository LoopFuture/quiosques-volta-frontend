import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import { useState } from 'react'
import * as ReactNative from 'react-native'
import { Text } from 'react-native'
import { TokenResponse } from 'expo-auth-session'
import { Provider } from '@/components/Provider'
import { AuthSessionProvider } from '@/features/auth/components/AuthSessionProvider'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { saveStoredAppPin } from '@/features/auth/pin'
import { useThemePreference } from '@/hooks/useAppPreferences'
import {
  BIOMETRICS_ENABLED_STORAGE_KEY,
  PIN_ENABLED_STORAGE_KEY,
  privacyPreferenceStorage,
  setStoredDevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import {
  readStoredAuthSession,
  saveStoredAuthSession,
} from '@/features/auth/storage'
import * as authSessionModel from '@/features/auth/models/session'
import * as authStorage from '@/features/auth/storage'
import {
  onboardingPreferenceStorage,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from '@/features/app-data/storage/device/onboarding'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { refreshAsync } = jest.requireMock('expo-auth-session')
const { __setExpoConfig } = jest.requireMock('expo-constants')
const { authenticateAsync, __setNextLocalAuthenticationResult } =
  jest.requireMock('expo-local-authentication')
const { __setBiometricHardware } = jest.requireMock('expo-local-authentication')
const { __getSecureStoreItem, __setSecureStoreItem } =
  jest.requireMock('expo-secure-store')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)
const mockFetch = jest.fn()
const originalFetch = global.fetch

function createSignedInTokenResponse() {
  return new TokenResponse({
    accessToken: 'signed-in-access-token',
    expiresIn: 3600,
    idToken: 'signed-in-id-token',
    issuedAt: Math.floor(Date.now() / 1000),
    refreshToken: 'signed-in-refresh-token',
    scope: 'openid profile email',
    tokenType: 'bearer',
  })
}

function AuthSessionHarness() {
  const {
    canAccessProtectedApp,
    completeSignIn,
    consumePendingBiometricPrompt,
    isPinUnlockEnabled,
    isAppLocked,
    isAuthenticated,
    session,
    signOut,
    status,
    unlockWithBiometrics,
    unlockWithPin,
  } = useAuthSession()
  const [pendingPromptResult, setPendingPromptResult] = useState('unknown')
  const [pinUnlockResult, setPinUnlockResult] = useState('idle')
  const [signInResult, setSignInResult] = useState('idle')
  const [unlockResult, setUnlockResult] = useState('idle')

  return (
    <>
      <Text>{`status:${status}`}</Text>
      <Text>{`authenticated:${isAuthenticated}`}</Text>
      <Text>{`access:${session?.accessToken ?? 'none'}`}</Text>
      <Text>{`locked:${isAppLocked}`}</Text>
      <Text>{`can-access:${canAccessProtectedApp}`}</Text>
      <Text>{`pin-enabled:${isPinUnlockEnabled}`}</Text>
      <Text>{`sign-in-result:${signInResult}`}</Text>
      <Text>{`pin-unlock-result:${pinUnlockResult}`}</Text>
      <Text>{`unlock-result:${unlockResult}`}</Text>
      <Text>{`pending-prompt:${pendingPromptResult}`}</Text>
      <Text
        onPress={() => {
          void completeSignIn(createSignedInTokenResponse())
            .then(() => {
              setSignInResult('success')
            })
            .catch((error) => {
              setSignInResult(
                error instanceof Error ? error.message : 'sign-in-error',
              )
            })
        }}
      >
        Complete sign in
      </Text>
      <Text
        onPress={() => {
          void unlockWithBiometrics().then((result) => {
            setUnlockResult(result.success ? 'success' : result.reason)
          })
        }}
      >
        Unlock
      </Text>
      <Text
        onPress={() => {
          void unlockWithPin('1234').then((result) => {
            setPinUnlockResult(result.success ? 'success' : result.reason)
          })
        }}
      >
        Unlock with PIN 1234
      </Text>
      <Text
        onPress={() => {
          void unlockWithPin('9999').then((result) => {
            setPinUnlockResult(result.success ? 'success' : result.reason)
          })
        }}
      >
        Unlock with PIN 9999
      </Text>
      <Text
        onPress={() => {
          setPendingPromptResult(String(consumePendingBiometricPrompt()))
        }}
      >
        Consume pending prompt
      </Text>
      <Text
        onPress={() => {
          void signOut()
        }}
      >
        Sign out
      </Text>
    </>
  )
}

function ProviderAuthSessionHarness() {
  const {
    canAccessProtectedApp,
    completeSignIn,
    isAppLocked,
    isAuthenticated,
    session,
    status,
    unlockWithBiometrics,
  } = useAuthSession()
  const { languageMode, setLanguageMode, setThemeMode, themeMode } =
    useThemePreference()

  return (
    <>
      <Text>{`status:${status}`}</Text>
      <Text>{`authenticated:${isAuthenticated}`}</Text>
      <Text>{`access:${session?.accessToken ?? 'none'}`}</Text>
      <Text>{`locked:${isAppLocked}`}</Text>
      <Text>{`can-access:${canAccessProtectedApp}`}</Text>
      <Text>{`theme:${themeMode}`}</Text>
      <Text>{`language:${languageMode}`}</Text>
      <Text onPress={() => completeSignIn(createSignedInTokenResponse())}>
        Provider complete sign in
      </Text>
      <Text
        onPress={() => {
          void unlockWithBiometrics()
        }}
      >
        Provider unlock
      </Text>
      <Text onPress={() => setThemeMode('dark')}>Set dark theme</Text>
      <Text onPress={() => setLanguageMode('en')}>Set English language</Text>
    </>
  )
}

describe('auth session provider', () => {
  const addEventListenerSpy = jest.spyOn(
    ReactNative.AppState,
    'addEventListener',
  )
  const mockAppStateSubscription = {
    remove: jest.fn(),
  }

  beforeAll(() => {
    global.fetch = mockFetch as typeof fetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
    addEventListenerSpy.mockImplementation(
      () => mockAppStateSubscription as never,
    )
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    global.fetch = originalFetch
    addEventListenerSpy.mockRestore()
  })

  it('starts anonymous when there is no stored session', async () => {
    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(screen.getByText('authenticated:false')).toBeTruthy()
      expect(screen.getByText('access:none')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
    })
  })

  it('restores a valid stored session on startup', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('authenticated:true')).toBeTruthy()
      expect(screen.getByText('access:persisted-access-token')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })
  })

  it('restores a valid stored session in a locked state when biometrics are enabled', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:true')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
    })
  })

  it('restores a valid stored session in a locked state when only PIN unlock is enabled', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    await saveStoredAppPin('1234')
    setStoredDevicePrivacySettings({
      biometricsEnabled: false,
      pinEnabled: true,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:true')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
      expect(screen.getByText('pin-enabled:true')).toBeTruthy()
    })
  })

  it('refreshes an expired session when a refresh token exists', async () => {
    await saveStoredAuthSession({
      accessToken: 'expired-access-token',
      expiresIn: 1,
      idToken: 'expired-id-token',
      issuedAt: 1,
      refreshToken: 'expired-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(refreshAsync).toHaveBeenCalledTimes(1)
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('access:mock-access-token')).toBeTruthy()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session-refresh.refresh.success',
      }),
    )
  })

  it('returns a failed biometric unlock result when there is no session', async () => {
    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('unlock-result:failed')).toBeTruthy()
    })
  })

  it('returns a not-available biometric unlock result when biometric unlock is not configured', async () => {
    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('sign-in-result:success')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('unlock-result:not-available')).toBeTruthy()
    })
  })

  it('unlocks a restored PIN-only session after a valid PIN entry', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    await saveStoredAppPin('1234')
    setStoredDevicePrivacySettings({
      biometricsEnabled: false,
      pinEnabled: true,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock with PIN 1234'))
    })

    await waitFor(() => {
      expect(screen.getByText('pin-unlock-result:success')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })
  })

  it('clears stale PIN protection when the stored PIN credential is missing', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: false,
      pinEnabled: true,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
      expect(screen.getByText('pin-enabled:false')).toBeTruthy()
    })

    expect(privacyPreferenceStorage.getString(PIN_ENABLED_STORAGE_KEY)).toBe(
      'false',
    )
  })

  it('clears stale biometric protection when hardware is unavailable', async () => {
    __setBiometricHardware(false)

    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    expect(
      privacyPreferenceStorage.getString(BIOMETRICS_ENABLED_STORAGE_KEY),
    ).toBe('false')
  })

  it('consumes pending biometric prompts only once', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    fireEvent.press(screen.getByText('Consume pending prompt'))
    expect(screen.getByText('pending-prompt:true')).toBeTruthy()

    fireEvent.press(screen.getByText('Consume pending prompt'))
    expect(screen.getByText('pending-prompt:false')).toBeTruthy()
  })

  it('clears the session when refresh fails for an expired token', async () => {
    await saveStoredAuthSession({
      accessToken: 'expired-access-token',
      expiresIn: 1,
      idToken: 'expired-id-token',
      issuedAt: 1,
      refreshToken: 'expired-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    refreshAsync.mockRejectedValueOnce(new Error('refresh failed'))

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('signs out from Keycloak and clears stored tokens', async () => {
    const handleSessionCleared = jest.fn()

    render(
      <AuthSessionProvider onSessionCleared={handleSessionCleared}>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('access:signed-in-access-token')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
      expect(handleSessionCleared).toHaveBeenCalledTimes(1)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    const [logoutUrl, requestInit] = mockFetch.mock.calls[0]
    const requestBody = new URLSearchParams(String(requestInit?.body))

    expect(logoutUrl).toBe(
      'https://keycloak.example.com/realms/volta/protocol/openid-connect/logout',
    )
    expect(requestInit).toMatchObject({
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    })
    expect(requestBody.get('client_id')).toBe('volta-mobile')
    expect(requestBody.get('refresh_token')).toBe('signed-in-refresh-token')
  })

  it('records sign-in persistence failures without authenticating the session', async () => {
    jest
      .spyOn(authStorage, 'saveStoredAuthSession')
      .mockRejectedValueOnce(new Error('persist failed'))

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('sign-in-result:persist failed')).toBeTruthy()
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'sign-in.persist-session.error',
      }),
    )
  })

  it('records session-clearing callback failures while still signing out', async () => {
    const handleSessionCleared = jest.fn(async () => {
      throw new Error('clear callback failed')
    })

    render(
      <AuthSessionProvider onSessionCleared={handleSessionCleared}>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(handleSessionCleared).toHaveBeenCalledTimes(1)
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session.clear-artifacts.error',
      }),
    )
  })

  it('skips remote logout requests when the session has no refresh token', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: undefined,
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'sign-out.remote-logout.info',
      }),
    )
  })

  it('logs non-ok Keycloak logout responses and still clears local session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'sign-out.remote-logout.error',
      }),
    )
  })

  it('unlocks a restored biometric session after successful local authentication', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(authenticateAsync).toHaveBeenCalledTimes(1)
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })
  })

  it('keeps the current session unlocked when biometrics are enabled while the app is active', async () => {
    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    act(() => {
      setStoredDevicePrivacySettings({
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
    })

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('status:authenticated')).toBeTruthy()
    expect(screen.getByText('locked:false')).toBeTruthy()
    expect(screen.getByText('can-access:true')).toBeTruthy()
  })

  it('keeps the app locked when biometric unlock is cancelled', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })
    __setNextLocalAuthenticationResult({
      error: 'user_cancel',
      success: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
    })
  })

  it('ignores inactive app-state changes for unlocked biometric sessions', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('locked:false')).toBeTruthy()
    })

    const handleAppStateChange = addEventListenerSpy.mock.calls[0]?.[1] as
      | ((state: ReactNative.AppStateStatus) => void)
      | undefined

    expect(handleAppStateChange).toBeDefined()

    act(() => {
      handleAppStateChange?.('inactive')
    })

    expect(screen.getByText('locked:false')).toBeTruthy()
    expect(screen.getByText('can-access:true')).toBeTruthy()

    act(() => {
      handleAppStateChange?.('active')
    })

    expect(screen.getByText('locked:false')).toBeTruthy()
    expect(screen.getByText('can-access:true')).toBeTruthy()
  })

  it('keeps biometric sessions unlocked when the app returns from background in the same process', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('locked:false')).toBeTruthy()
    })

    const handleAppStateChange = addEventListenerSpy.mock.calls[0]?.[1] as
      | ((state: ReactNative.AppStateStatus) => void)
      | undefined

    expect(handleAppStateChange).toBeDefined()

    act(() => {
      handleAppStateChange?.('background')
    })

    expect(screen.getByText('locked:false')).toBeTruthy()
    expect(screen.getByText('can-access:true')).toBeTruthy()

    act(() => {
      handleAppStateChange?.('active')
    })

    expect(screen.getByText('locked:false')).toBeTruthy()
    expect(screen.getByText('can-access:true')).toBeTruthy()
  })

  it('keeps a restored biometric session unlocked when theme and language change', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <Provider>
        <ProviderAuthSessionHarness />
      </Provider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:true')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Provider unlock'))
    })

    await waitFor(() => {
      expect(authenticateAsync).toHaveBeenCalledTimes(1)
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    act(() => {
      fireEvent.press(screen.getByText('Set dark theme'))
      fireEvent.press(screen.getByText('Set English language'))
    })

    await waitFor(() => {
      expect(screen.getByText('theme:dark')).toBeTruthy()
      expect(screen.getByText('language:en')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    expect(authenticateAsync).toHaveBeenCalledTimes(1)
  })

  it('keeps the first sign-in unlocked when biometrics are enabled and preferences change', async () => {
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    render(
      <Provider>
        <ProviderAuthSessionHarness />
      </Provider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:false')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Provider complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    act(() => {
      fireEvent.press(screen.getByText('Set dark theme'))
      fireEvent.press(screen.getByText('Set English language'))
    })

    await waitFor(() => {
      expect(screen.getByText('theme:dark')).toBeTruthy()
      expect(screen.getByText('language:en')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    expect(authenticateAsync).not.toHaveBeenCalled()
  })

  it('keeps the first sign-in unlocked after the app remounts from the auth browser redirect', async () => {
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })

    const firstView = render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    firstView.unmount()

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
      expect(screen.getByText('locked:false')).toBeTruthy()
      expect(screen.getByText('can-access:true')).toBeTruthy()
    })

    expect(authenticateAsync).not.toHaveBeenCalled()
  })

  it('leaves anonymous state unchanged when the app becomes active without a session', async () => {
    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    const handleAppStateChange = addEventListenerSpy.mock.calls[0]?.[1] as
      | ((state: ReactNative.AppStateStatus) => void)
      | undefined

    act(() => {
      handleAppStateChange?.('active')
    })

    expect(refreshAsync).not.toHaveBeenCalled()
    expect(screen.getByText('status:anonymous')).toBeTruthy()
  })

  it('clears expired sessions without refresh tokens during hydration', async () => {
    await saveStoredAuthSession({
      accessToken: 'expired-access-token',
      expiresIn: 1,
      idToken: 'expired-id-token',
      issuedAt: 1,
      refreshToken: undefined,
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session.hydrate.info',
      }),
    )
  })

  it('clears stale sessions without refresh tokens when the app resumes', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: undefined,
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    const freshnessSpy = jest
      .spyOn(authSessionModel, 'isStoredAuthSessionFresh')
      .mockReturnValue(false)
    const handleAppStateChange = addEventListenerSpy.mock.calls[0]?.[1] as
      | ((state: ReactNative.AppStateStatus) => void)
      | undefined

    act(() => {
      handleAppStateChange?.('active')
    })

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    freshnessSpy.mockRestore()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session-refresh.refresh.info',
      }),
    )
  })

  it('clears stale sessions when app-resume refresh fails', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    const freshnessSpy = jest
      .spyOn(authSessionModel, 'isStoredAuthSessionFresh')
      .mockReturnValue(false)
    const handleAppStateChange = addEventListenerSpy.mock.calls[0]?.[1] as
      | ((state: ReactNative.AppStateStatus) => void)
      | undefined

    refreshAsync.mockRejectedValueOnce(new Error('resume refresh failed'))

    act(() => {
      handleAppStateChange?.('active')
    })

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    freshnessSpy.mockRestore()
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session-refresh.refresh.error',
      }),
    )
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session-refresh.refresh.info',
      }),
    )
  })

  it('returns a failed unlock result when biometric authentication throws', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })
    authenticateAsync.mockRejectedValueOnce(new Error('biometric failed'))

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'))
    })

    await waitFor(() => {
      expect(screen.getByText('unlock-result:failed')).toBeTruthy()
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'app-lock.unlock.error',
      }),
    )
  })

  it('signs out after five consecutive invalid PIN attempts in one locked session', async () => {
    await saveStoredAuthSession({
      accessToken: 'persisted-access-token',
      expiresIn: 3600,
      idToken: 'persisted-id-token',
      issuedAt: Math.floor(Date.now() / 1000),
      refreshToken: 'persisted-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    await saveStoredAppPin('1234')
    setStoredDevicePrivacySettings({
      biometricsEnabled: false,
      pinEnabled: true,
      pushNotificationsEnabled: false,
    })

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('locked:true')).toBeTruthy()
    })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await act(async () => {
        fireEvent.press(screen.getByText('Unlock with PIN 9999'))
      })
    }

    await waitFor(async () => {
      expect(
        screen.getByText('pin-unlock-result:too-many-attempts'),
      ).toBeTruthy()
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
    })

    expect(privacyPreferenceStorage.getString(PIN_ENABLED_STORAGE_KEY)).toBe(
      'false',
    )
    expect(__getSecureStoreItem('auth.pinCredential')).toBeNull()
  })

  it('clears local session artifacts when Keycloak logout fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('logout failed'))

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'sign-out.remote-logout.error',
      }),
    )
    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('preserves onboarding completion when signing out', async () => {
    onboardingPreferenceStorage.set(ONBOARDING_COMPLETED_STORAGE_KEY, 'true')

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Complete sign in'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:authenticated')).toBeTruthy()
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Sign out'))
    })

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    expect(
      onboardingPreferenceStorage.getString(ONBOARDING_COMPLETED_STORAGE_KEY),
    ).toBe('true')
  })

  it('clears session artifacts when refresh fails for an expired token', async () => {
    const handleSessionCleared = jest.fn()

    await saveStoredAuthSession({
      accessToken: 'expired-access-token',
      expiresIn: 1,
      idToken: 'expired-id-token',
      issuedAt: 1,
      refreshToken: 'expired-refresh-token',
      scope: 'openid profile email',
      tokenType: 'bearer',
    })
    refreshAsync.mockRejectedValueOnce(new Error('refresh failed'))

    render(
      <AuthSessionProvider onSessionCleared={handleSessionCleared}>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(async () => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
      expect(await readStoredAuthSession()).toBeNull()
      expect(handleSessionCleared).toHaveBeenCalledTimes(1)
    })
  })

  it('clears corrupted stored metadata instead of throwing during hydration', async () => {
    __setSecureStoreItem('auth.keycloak.access', 'persisted-access-token')
    __setSecureStoreItem('auth.keycloak.meta', '{invalid-json')

    await expect(readStoredAuthSession()).resolves.toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.access')).toBeNull()
    expect(__getSecureStoreItem('auth.keycloak.meta')).toBeNull()
    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('handles unexpected session hydration read failures', async () => {
    jest
      .spyOn(authStorage, 'readStoredAuthSession')
      .mockRejectedValueOnce(new Error('hydrate failed'))

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('status:anonymous')).toBeTruthy()
    })

    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'session.hydrate.error',
      }),
    )
  })

  it('preserves stored biometric preferences and adds the pin preference during migration', () => {
    privacyPreferenceStorage.set(BIOMETRICS_ENABLED_STORAGE_KEY, 'true')

    render(
      <AuthSessionProvider>
        <AuthSessionHarness />
      </AuthSessionProvider>,
    )

    expect(
      privacyPreferenceStorage.getString(BIOMETRICS_ENABLED_STORAGE_KEY),
    ).toBe('true')
    expect(privacyPreferenceStorage.getString(PIN_ENABLED_STORAGE_KEY)).toBe(
      'false',
    )
  })
})
