import {
  createAuthSessionMock,
  mockHideAsync,
  mockInitializeMonitoring,
  mockRecordDiagnosticEvent,
  mockRegisterNavigationContainer,
  mockRouterReplace,
  mockStackProtected,
  mockStackScreen,
  mockUseAuthSession,
  mockUseGlobalSearchParams,
  mockUsePathname,
  mockUseProfileQuery,
  resetAppLayoutMocks,
} from '@tests/support/app-layout-mocks'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native'
import RootLayout, {
  ErrorBoundary as RootErrorBoundary,
  unstable_settings,
} from '@/app/_layout'

describe('app/_layout', () => {
  beforeEach(() => {
    resetAppLayoutMocks()
  })

  it('declares auth as the initial route and can render immediately', () => {
    const view = render(<RootLayout />)

    expect(unstable_settings.initialRouteName).toBe('auth')
    expect(view.toJSON()).not.toBeNull()
  })

  it('renders the root stack and hides the splash screen when navigation is ready', async () => {
    render(<RootLayout />)

    await waitFor(() => {
      expect(mockRegisterNavigationContainer).toHaveBeenCalled()
      expect(mockHideAsync).toHaveBeenCalled()
    })

    expect(screen.getByText('status:dark')).toBeTruthy()
    expect(
      mockStackProtected.mock.calls.map((call: [any]) => call[0].guard),
    ).toEqual([true, false, false])
    expect(
      mockStackScreen.mock.calls.map((call: [any]) => call[0].name),
    ).toEqual(['auth', 'auth/unlock', 'setup', '(tabs)', 'profile', 'wallet'])
  })

  it('renders the profile bootstrap error state and retries profile loading', async () => {
    const refetch = jest.fn()

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch,
    })

    render(<RootLayout />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-bootstrap-error-screen')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-bootstrap-error-state'))

    expect(refetch).toHaveBeenCalled()
  })

  it('renders the forced e2e profile bootstrap error state and clears it on retry', async () => {
    mockUsePathname.mockReturnValue('/profile')
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        status: 'authenticated',
      }),
    )
    mockUseGlobalSearchParams.mockReturnValue({
      __e2eRootState: 'profile-bootstrap-error',
    })
    mockUseProfileQuery.mockReturnValue({
      data: {
        onboarding: {
          status: 'completed',
        },
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    const { __setExpoConfig } = jest.requireMock('expo-constants') as {
      __setExpoConfig: jest.Mock
    }

    __setExpoConfig({
      extra: {
        api: {
          baseUrl: 'https://volta.be.dev.theloop.tech',
        },
        e2e: {
          enabled: true,
        },
        eas: {
          projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
        },
        keycloak: {
          clientId: 'volta-mobile',
          issuerUrl: 'https://keycloak.example.com/realms/volta',
          scopes: ['openid', 'profile', 'email'],
        },
        sentry: {},
        webApp: {
          baseUrl: 'https://volta.example.com',
        },
      },
    })

    render(<RootLayout />)

    await waitFor(() => {
      expect(screen.getByTestId('profile-bootstrap-error-screen')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-bootstrap-error-state'))

    expect(mockRouterReplace).toHaveBeenCalledWith('/profile')
  })

  it('enables the protected app stack when profile setup is completed', async () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        canAccessProtectedApp: true,
        status: 'authenticated',
      }),
    )
    mockUseProfileQuery.mockReturnValue({
      data: {
        onboarding: {
          status: 'completed',
        },
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    render(<RootLayout />)

    await waitFor(() => {
      expect(mockHideAsync).toHaveBeenCalled()
    })

    expect(
      mockStackProtected.mock.calls.map((call: [any]) => call[0].guard),
    ).toEqual([false, false, true])
  })

  it('captures route errors through the root error boundary only once per render', async () => {
    const error = new Error('boom')
    const retry = jest.fn()
    const view = render(<RootErrorBoundary error={error} retry={retry} />)

    await waitFor(() => {
      expect(mockInitializeMonitoring).toHaveBeenCalled()
      expect(mockRecordDiagnosticEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          captureError: true,
          details: {
            message: 'boom',
            name: 'Error',
          },
          domain: 'router',
          error,
          operation: 'route',
          phase: 'error-boundary',
          status: 'error',
        }),
      )
    })

    view.rerender(<RootErrorBoundary error={error} retry={retry} />)

    expect(mockRecordDiagnosticEvent).toHaveBeenCalledTimes(1)
  })
})
