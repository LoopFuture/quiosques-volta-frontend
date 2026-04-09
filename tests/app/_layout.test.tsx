import {
  createAuthSessionMock,
  mockHideAsync,
  mockInitializeMonitoring,
  mockRecordDiagnosticEvent,
  mockRegisterNavigationContainer,
  mockStackProtected,
  mockStackScreen,
  mockUseAuthSession,
  mockUseFonts,
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

  it('declares auth as the initial route and waits for fonts before rendering', () => {
    mockUseFonts.mockReturnValue([false, null])

    const view = render(<RootLayout />)

    expect(unstable_settings.initialRouteName).toBe('auth')
    expect(view.toJSON()).toBeNull()
    expect(mockHideAsync).not.toHaveBeenCalled()
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
    ).toEqual(['auth', 'setup', '(tabs)', 'profile', 'wallet'])
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
