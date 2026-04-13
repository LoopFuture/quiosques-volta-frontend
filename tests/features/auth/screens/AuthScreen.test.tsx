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
import { authRoutes } from '@/features/auth/routes'
import { i18n } from '@/i18n'
import { createMockExpoConfig } from '@tests/support/expo-config'

const mockCompleteSignIn = jest.fn()
const mockSignOut = jest.fn()

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
const {
  __mockRouterPush: mockRouterPush,
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
} = jest.requireMock('expo-router')
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
    unlockWithBiometrics: jest.fn().mockResolvedValue({
      success: true,
    }),
    unlockWithPin: jest.fn().mockResolvedValue({
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
    mockUseLocalSearchParams.mockReturnValue({})
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

  it('renders the login and register actions on the auth screen', () => {
    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-login-button')).toBeTruthy()
    expect(screen.getByTestId('auth-register-button')).toBeTruthy()
    expect(screen.queryByTestId('auth-open-unlock-button')).toBeNull()
    expect(screen.queryByText(i18n.t('auth.dividerLabel'))).toBeNull()
  })

  it('redirects locked sessions to the dedicated unlock route on app open', async () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isAppLocked: true,
        isAuthenticated: true,
        isPinUnlockEnabled: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(authRoutes.unlock)
    })
  })

  it('shows an explicit unlock entry action when returning to the login page from a locked session', () => {
    mockUseLocalSearchParams.mockReturnValue({
      showLogin: '1',
    })
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isAppLocked: true,
        isAuthenticated: true,
        isPinUnlockEnabled: true,
        session: { accessToken: 'token', expiresAt: null },
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    expect(screen.getByTestId('auth-open-unlock-button')).toBeTruthy()
    expect(screen.getByText(i18n.t('auth.dividerLabel'))).toBeTruthy()

    fireEvent.press(screen.getByTestId('auth-open-unlock-button'))

    expect(mockRouterPush).toHaveBeenCalledWith(authRoutes.unlock)
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

  it('signs out and forces the Keycloak login prompt when re-entering from the login page of a locked session', async () => {
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
    mockUseLocalSearchParams.mockReturnValue({
      showLogin: '1',
    })
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isAppLocked: true,
        isAuthenticated: true,
        isPinUnlockEnabled: true,
        session: { accessToken: 'token', expiresAt: null },
        signOut: mockSignOut.mockResolvedValue(undefined),
        status: 'authenticated',
      }),
    )

    renderWithProvider(<AuthScreen />)

    const reloginRequest = __getAuthRequests()
      .slice(-3)
      .find((request: any) => request.config.extraParams.prompt === 'login')

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
