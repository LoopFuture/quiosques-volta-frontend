import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import AuthScreen from '@/features/auth/screens/AuthScreen'
import { renderWithProvider } from '@tests/support/test-utils'
import {
  LANGUAGE_MODE_STORAGE_KEY,
  languagePreferenceStorage,
} from '@/features/app-data/storage/preferences/language'
import {
  THEME_MODE_STORAGE_KEY,
  themePreferenceStorage,
} from '@/features/app-data/storage/preferences/theme'
import {
  onboardingPreferenceStorage,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from '@/features/app-data/storage/device/onboarding'
import { i18n } from '@/i18n'
import { createMockExpoConfig } from '@tests/support/expo-config'

const mockCompleteSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockUnlockWithBiometrics = jest.fn()
const mockUnlockWithPin = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/features/auth/components/AuthSessionProvider', () => ({
  AuthSessionProvider: ({ children }: any) => children,
}))

const { __getAuthRequests, __setNextPromptResults, exchangeCodeAsync } =
  jest.requireMock('expo-auth-session')
const { __setExpoConfig } = jest.requireMock('expo-constants')
const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')
const { addBreadcrumb, captureException } = jest.requireMock(
  '@sentry/react-native',
)
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)

function createAuthSessionMock(overrides: Record<string, unknown> = {}) {
  return {
    appLockRevision: 0,
    completeSignIn: mockCompleteSignIn.mockResolvedValue(undefined),
    consumePendingBiometricPrompt: jest.fn(() => false),
    isBiometricUnlockEnabled: false,
    isAppLocked: false,
    isAuthenticated: false,
    isPinUnlockEnabled: false,
    session: null,
    signOut: mockSignOut.mockResolvedValue(undefined),
    status: 'anonymous',
    unlockWithBiometrics: mockUnlockWithBiometrics.mockResolvedValue({
      success: true,
    }),
    unlockWithPin: mockUnlockWithPin.mockResolvedValue({
      success: true,
    }),
    ...overrides,
  }
}

describe('auth screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __setExpoConfig(
      createMockExpoConfig({
        sentry: {
          dsn: 'https://public@example.ingest.sentry.io/1',
          environment: 'test',
        },
      }),
    )
    languagePreferenceStorage.clearAll()
    themePreferenceStorage.clearAll()
    onboardingPreferenceStorage.set(ONBOARDING_COMPLETED_STORAGE_KEY, 'true')
    mockUseAuthSession.mockReturnValue(createAuthSessionMock())
  })

  it('shows onboarding before the auth actions on first launch', () => {
    act(() => {
      onboardingPreferenceStorage.remove(ONBOARDING_COMPLETED_STORAGE_KEY)
    })

    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('onboarding-screen')).toBeTruthy()
    expect(screen.getByText('Devolve e recebe sem surpresas')).toBeTruthy()
    expect(screen.getByText('1 de 4')).toBeTruthy()
    expect(screen.queryByTestId('auth-login-button')).toBeNull()
    expect(__getAuthRequests()).toHaveLength(0)
  })

  it('skips onboarding when the user is already authenticated', () => {
    act(() => {
      onboardingPreferenceStorage.remove(ONBOARDING_COMPLETED_STORAGE_KEY)
    })
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    expect(screen.queryByTestId('onboarding-screen')).toBeNull()
    expect(screen.getByTestId('auth-login-button')).toBeTruthy()
  })

  it('stores onboarding completion and skips it on later auth renders', () => {
    act(() => {
      onboardingPreferenceStorage.remove(ONBOARDING_COMPLETED_STORAGE_KEY)
    })

    const view = renderWithProvider(<AuthScreen />)

    fireEvent.press(screen.getByTestId('onboarding-later-button'))

    expect(
      onboardingPreferenceStorage.getString(ONBOARDING_COMPLETED_STORAGE_KEY),
    ).toBe('true')
    expect(screen.queryByTestId('onboarding-screen')).toBeNull()
    expect(screen.getByTestId('auth-login-button')).toBeTruthy()

    view.unmount()

    renderWithProvider(<AuthScreen />)

    expect(screen.queryByTestId('onboarding-screen')).toBeNull()
    expect(screen.getByTestId('auth-login-button')).toBeTruthy()
  })

  it('configures the login and register requests with PKCE, the system theme, and the current locale by default', () => {
    renderWithProvider(<AuthScreen />)

    const authRequests = __getAuthRequests().slice(-3)
    const registerRequest = authRequests.find(
      (request: any) => request.config.extraParams.prompt === 'create',
    )
    const reloginRequest = authRequests.find(
      (request: any) => request.config.extraParams.prompt === 'login',
    )

    expect(registerRequest).toBeDefined()
    expect(reloginRequest).toBeDefined()

    expect(authRequests[0].config).toEqual(
      expect.objectContaining({
        clientId: 'volta-mobile',
        codeChallengeMethod: 'S256',
        extraParams: {
          theme: 'system',
          ui_locales: 'pt',
        },
        redirectUri: 'voltafrontend://auth/callback',
        responseType: 'code',
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
      }),
    )
    expect(registerRequest?.config).toEqual(
      expect.objectContaining({
        clientId: 'volta-mobile',
        codeChallengeMethod: 'S256',
        extraParams: {
          prompt: 'create',
          theme: 'system',
          ui_locales: 'pt',
        },
        redirectUri: 'voltafrontend://auth/callback',
        responseType: 'code',
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
      }),
    )
    expect(reloginRequest?.config).toEqual(
      expect.objectContaining({
        clientId: 'volta-mobile',
        codeChallengeMethod: 'S256',
        extraParams: {
          prompt: 'login',
          theme: 'system',
          ui_locales: 'pt',
        },
        redirectUri: 'voltafrontend://auth/callback',
        responseType: 'code',
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
      }),
    )
  })

  it('maps the theme query param from stored light and dark preferences', () => {
    act(() => {
      themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'dark')
    })

    renderWithProvider(<AuthScreen />)

    let authRequests = __getAuthRequests().slice(-3)
    expect(authRequests[0].config.extraParams).toEqual({
      theme: 'dark',
      ui_locales: 'pt',
    })
    expect(authRequests[2].config.extraParams).toEqual({
      prompt: 'login',
      theme: 'dark',
      ui_locales: 'pt',
    })

    act(() => {
      themePreferenceStorage.set(THEME_MODE_STORAGE_KEY, 'light')
    })
    renderWithProvider(<AuthScreen />)

    authRequests = __getAuthRequests().slice(-3)
    expect(authRequests[0].config.extraParams).toEqual({
      theme: 'light',
      ui_locales: 'pt',
    })
    expect(authRequests[2].config.extraParams).toEqual({
      prompt: 'login',
      theme: 'light',
      ui_locales: 'pt',
    })
  })

  it('maps the language query param from stored language preferences', () => {
    act(() => {
      languagePreferenceStorage.set(LANGUAGE_MODE_STORAGE_KEY, 'en')
    })

    renderWithProvider(<AuthScreen />)

    const authRequests = __getAuthRequests().slice(-3)

    expect(authRequests[0].config.extraParams).toEqual({
      theme: 'system',
      ui_locales: 'en',
    })
    expect(authRequests[1].config.extraParams).toEqual({
      prompt: 'create',
      theme: 'system',
      ui_locales: 'en',
    })
    expect(authRequests[2].config.extraParams).toEqual({
      prompt: 'login',
      theme: 'system',
      ui_locales: 'en',
    })
  })

  it('renders the login, biometric, and register actions on the auth screen', () => {
    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-login-button')).toBeTruthy()
    expect(screen.getByTestId('auth-biometric-button')).toBeTruthy()
    expect(screen.getByTestId('auth-register-button')).toBeTruthy()
  })

  it('renders the biometric unlock actions on the shared auth surface when the session is locked', async () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        appLockRevision: 1,
        consumePendingBiometricPrompt: jest.fn(() => true),
        isBiometricUnlockEnabled: true,
        isAppLocked: true,
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        signOut: mockSignOut.mockResolvedValue(undefined),
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-biometric-button')).toBeTruthy()
    expect(screen.getByTestId('auth-login-button')).toBeTruthy()
    expect(screen.getByTestId('auth-register-button')).toBeTruthy()

    await waitFor(() => {
      expect(mockUnlockWithBiometrics).toHaveBeenCalledTimes(1)
    })
  })

  it('renders the PIN unlock controls on the shared auth surface when the session is locked', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        consumePendingBiometricPrompt: jest.fn(() => false),
        isAppLocked: true,
        isAuthenticated: true,
        isPinUnlockEnabled: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-pin-input')).toBeTruthy()
    expect(screen.getByTestId('auth-pin-button')).toBeTruthy()
    expect(screen.queryByTestId('auth-biometric-button')).toBeNull()
  })

  it('renders both biometric and PIN unlock controls when both unlock methods are enabled', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        consumePendingBiometricPrompt: jest.fn(() => false),
        isAppLocked: true,
        isAuthenticated: true,
        isBiometricUnlockEnabled: true,
        isPinUnlockEnabled: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-biometric-button')).toBeTruthy()
    expect(screen.getByTestId('auth-pin-input')).toBeTruthy()
    expect(screen.getByTestId('auth-pin-button')).toBeTruthy()
  })

  it.each([
    ['invalid-pin', 'auth.lock.invalidPinError'],
    ['too-many-attempts', 'auth.lock.tooManyPinAttemptsError'],
  ] as const)(
    'shows the translated PIN unlock error for %s',
    async (reason, translationKey) => {
      const unlockWithPin = jest.fn().mockResolvedValue({
        reason,
        success: false,
      })

      mockUseAuthSession.mockReturnValue(
        createAuthSessionMock({
          consumePendingBiometricPrompt: jest.fn(() => false),
          isAppLocked: true,
          isAuthenticated: true,
          isPinUnlockEnabled: true,
          session: { accessToken: 'token', expiresAt: null },
          status: 'authenticated',
          unlockWithPin,
        }),
      )

      renderWithProvider(<AuthScreen />)

      await act(async () => {
        fireEvent.changeText(screen.getByTestId('auth-pin-input'), '9999')
      })

      await act(async () => {
        fireEvent.press(screen.getByTestId('auth-pin-button'))
      })

      await waitFor(() => {
        expect(unlockWithPin).toHaveBeenCalledWith('9999')
        expect(screen.getByText(i18n.t(translationKey))).toBeTruthy()
      })
    },
  )

  it.each([
    ['not-available', 'auth.lock.notAvailableError'],
    ['not-enrolled', 'auth.lock.notEnrolledError'],
    ['cancelled', 'auth.lock.cancelledError'],
    ['failed', 'auth.lock.failedError'],
  ] as const)(
    'shows the translated biometric unlock error for %s',
    async (reason, translationKey) => {
      const unlockWithBiometrics = jest.fn().mockResolvedValue({
        reason,
        success: false,
      })

      mockUseAuthSession.mockReturnValue(
        createAuthSessionMock({
          consumePendingBiometricPrompt: jest.fn(() => false),
          isBiometricUnlockEnabled: true,
          isAppLocked: true,
          isAuthenticated: true,
          session: { accessToken: 'token', expiresAt: null },
          status: 'authenticated',
          unlockWithBiometrics,
        }),
      )

      renderWithProvider(<AuthScreen />)

      await act(async () => {
        fireEvent.press(screen.getByTestId('auth-biometric-button'))
      })

      await waitFor(() => {
        expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('auth-error-text')).toBeTruthy()
        expect(screen.getByText(i18n.t(translationKey))).toBeTruthy()
      })
    },
  )

  it('does not auto-prompt biometrics again when the auth screen remounts without a new lock event', async () => {
    const consumePendingBiometricPrompt = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValue(false)

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        appLockRevision: 1,
        consumePendingBiometricPrompt,
        isBiometricUnlockEnabled: true,
        isAppLocked: true,
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        signOut: mockSignOut.mockResolvedValue(undefined),
        status: 'authenticated',
      }),
    )

    const firstView = renderWithProvider(<AuthScreen />)

    await waitFor(() => {
      expect(mockUnlockWithBiometrics).toHaveBeenCalledTimes(1)
    })

    firstView.unmount()

    renderWithProvider(<AuthScreen />)

    expect(mockUnlockWithBiometrics).toHaveBeenCalledTimes(1)
    expect(consumePendingBiometricPrompt.mock.calls.length).toBeGreaterThan(1)
  })

  it('exchanges the authorization code and routes home after login succeeds', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {
          code: 'login-code',
        },
        type: 'success',
        url: 'voltafrontend://auth/callback?code=login-code',
      },
    ])

    renderWithProvider(<AuthScreen />)
    const authRequests = __getAuthRequests().slice(-3)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-login-button'))
    })

    await waitFor(() => {
      expect(exchangeCodeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'login-code',
          extraParams: {
            code_verifier: authRequests[0].request.codeVerifier,
          },
        }),
        expect.objectContaining({
          tokenEndpoint:
            'https://keycloak.example.com/realms/volta/protocol/openid-connect/token',
        }),
      )
      expect(mockCompleteSignIn).toHaveBeenCalledTimes(1)
      expect(mockRouterReplace).toHaveBeenCalledWith('/')
    })

    expect(mockUnlockWithBiometrics).not.toHaveBeenCalled()
  })

  it('opens registration with prompt=create', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {
          code: 'register-code',
        },
        type: 'success',
        url: 'voltafrontend://auth/callback?code=register-code',
      },
    ])

    renderWithProvider(<AuthScreen />)

    const authRequests = __getAuthRequests().slice(-3)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-register-button'))
    })

    await waitFor(() => {
      expect(authRequests[1].promptAsync).toHaveBeenCalledTimes(1)
      expect(exchangeCodeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'register-code',
          extraParams: {
            code_verifier: authRequests[1].request.codeVerifier,
          },
        }),
        expect.anything(),
      )
    })
  })

  it('signs out and forces the Keycloak login prompt when re-entering from a locked session', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {
          code: 'relogin-code',
        },
        type: 'success',
        url: 'voltafrontend://auth/callback?code=relogin-code',
      },
    ])

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        appLockRevision: 1,
        consumePendingBiometricPrompt: jest.fn(() => false),
        isAppLocked: true,
        isAuthenticated: true,
        session: { accessToken: 'token', expiresAt: null },
        signOut: mockSignOut.mockResolvedValue(undefined),
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    const reloginRequest = __getAuthRequests()
      .slice(-3)
      .find((request: any) => request.config.extraParams.prompt === 'login')

    expect(reloginRequest).toBeDefined()

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-login-button'))
    })

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(reloginRequest?.promptAsync).toHaveBeenCalledTimes(1)
      expect(exchangeCodeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'relogin-code',
          extraParams: {
            code_verifier: reloginRequest?.request.codeVerifier,
          },
        }),
        expect.anything(),
      )
    })
  })

  it('does not exchange tokens when the auth prompt is cancelled', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {},
        type: 'cancel',
        url: null,
      },
    ])

    renderWithProvider(<AuthScreen />)
    const authRequests = __getAuthRequests().slice(-3)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-login-button'))
    })

    await waitFor(() => {
      expect(authRequests[0].promptAsync).toHaveBeenCalledTimes(1)
    })

    expect(exchangeCodeAsync).not.toHaveBeenCalled()
    expect(mockCompleteSignIn).not.toHaveBeenCalled()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('shows the error state when code exchange fails', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {
          code: 'broken-code',
        },
        type: 'success',
        url: 'voltafrontend://auth/callback?code=broken-code',
      },
    ])
    exchangeCodeAsync.mockRejectedValueOnce(new Error('Exchange failed'))

    renderWithProvider(<AuthScreen />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-login-button'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-error-text')).toBeTruthy()
      expect(screen.getByText('Exchange failed')).toBeTruthy()
    })

    expect(addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'sign-in.exchange.error',
      }),
    )
    expect(captureException).toHaveBeenCalledWith(expect.any(Error))
  })

  it('falls back to the generic auth error copy for non-Error failures', async () => {
    __setNextPromptResults([
      {
        authentication: null,
        error: null,
        errorCode: null,
        params: {
          code: 'broken-code',
        },
        type: 'success',
        url: 'voltafrontend://auth/callback?code=broken-code',
      },
    ])
    exchangeCodeAsync.mockRejectedValueOnce('broken')

    renderWithProvider(<AuthScreen />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-login-button'))
    })

    await waitFor(() => {
      expect(screen.getByText(i18n.t('auth.errorFallback'))).toBeTruthy()
    })
  })
})
