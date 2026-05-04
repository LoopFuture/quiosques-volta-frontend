import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import UnlockScreen from '@/features/auth/screens/UnlockScreen'
import { renderWithProvider } from '@tests/support/test-utils'
import { authRoutes } from '@/features/auth/routes'
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

const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)

function createAuthSessionMock(overrides: Record<string, unknown> = {}) {
  return {
    appLockRevision: 0,
    completeSignIn: jest.fn(),
    consumePendingBiometricPrompt: jest.fn(() => false),
    isBiometricUnlockEnabled: false,
    isAppLocked: true,
    isAuthenticated: true,
    isPinUnlockEnabled: false,
    session: { accessToken: 'token', expiresAt: null },
    signOut: jest.fn(),
    status: 'authenticated',
    unlockWithBiometrics: jest.fn().mockResolvedValue({
      success: true,
    }),
    unlockWithPin: jest.fn().mockResolvedValue({
      success: true,
    }),
    ...overrides,
  }
}

describe('unlock screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuthSession.mockReturnValue(createAuthSessionMock())
  })

  it('redirects back to auth when there is no locked session', async () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isAppLocked: false,
        isAuthenticated: false,
        session: null,
        status: 'anonymous',
      }),
    )

    renderWithProvider(<UnlockScreen />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(authRoutes.index)
    })
  })

  it('auto-prompts biometrics once when opening from a new lock event', async () => {
    const consumePendingBiometricPrompt = jest.fn(() => true)
    const unlockWithBiometrics = jest.fn().mockResolvedValue({
      success: true,
    })

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        appLockRevision: 1,
        consumePendingBiometricPrompt,
        isBiometricUnlockEnabled: true,
        unlockWithBiometrics,
      }),
    )

    renderWithProvider(<UnlockScreen />)

    await waitFor(() => {
      expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
    })
  })

  it('does not auto-prompt biometrics again when the unlock screen remounts without a new lock event', async () => {
    const consumePendingBiometricPrompt = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValue(false)
    const unlockWithBiometrics = jest.fn().mockResolvedValue({
      success: true,
    })

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        appLockRevision: 1,
        consumePendingBiometricPrompt,
        isBiometricUnlockEnabled: true,
        unlockWithBiometrics,
      }),
    )

    const firstView = renderWithProvider(<UnlockScreen />)

    await waitFor(() => {
      expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
    })

    firstView.unmount()

    renderWithProvider(<UnlockScreen />)

    expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
    expect(consumePendingBiometricPrompt.mock.calls.length).toBeGreaterThan(1)
  })

  it.each(['not-available', 'not-enrolled'] as const)(
    'disables biometrics and shows recovery guidance after %s is returned',
    async (reason) => {
      const unlockWithBiometrics = jest.fn().mockResolvedValue({
        reason,
        success: false,
      })

      mockUseAuthSession.mockReturnValue(
        createAuthSessionMock({
          isBiometricUnlockEnabled: true,
          unlockWithBiometrics,
        }),
      )

      renderWithProvider(<UnlockScreen />)

      await act(async () => {
        fireEvent.press(screen.getByTestId('auth-biometric-button'))
      })

      await waitFor(() => {
        expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
        expect(
          screen.getByTestId('auth-biometric-button').props.accessibilityState
            .disabled,
        ).toBe(true)
        expect(screen.getByTestId('auth-error-text')).toBeTruthy()
        expect(
          screen.getByTestId('auth-unlock-login-again-button'),
        ).toBeTruthy()
      })
    },
  )

  it.each(['cancelled', 'failed'] as const)(
    'shows a biometric error message for %s',
    async (reason) => {
      const unlockWithBiometrics = jest.fn().mockResolvedValue({
        reason,
        success: false,
      })

      mockUseAuthSession.mockReturnValue(
        createAuthSessionMock({
          isBiometricUnlockEnabled: true,
          unlockWithBiometrics,
        }),
      )

      renderWithProvider(<UnlockScreen />)

      await act(async () => {
        fireEvent.press(screen.getByTestId('auth-biometric-button'))
      })

      await waitFor(() => {
        expect(unlockWithBiometrics).toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('auth-error-text')).toBeTruthy()
      })
    },
  )

  it('submits the PIN from the keypad without using the keyboard', async () => {
    const unlockWithPin = jest.fn().mockResolvedValue({
      success: true,
    })

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isPinUnlockEnabled: true,
        unlockWithPin,
      }),
    )

    renderWithProvider(<UnlockScreen />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-pin-key-1'))
      fireEvent.press(screen.getByTestId('auth-pin-key-2'))
      fireEvent.press(screen.getByTestId('auth-pin-key-3'))
      fireEvent.press(screen.getByTestId('auth-pin-key-4'))
    })

    await waitFor(() => {
      expect(unlockWithPin).toHaveBeenCalledWith('1234')
    })
  })

  it.each(['failed', 'invalid-pin'] as const)(
    'shows red PIN feedback without the recovery card for %s',
    async (reason) => {
      const unlockWithPin = jest.fn().mockResolvedValue({
        reason,
        success: false,
      })

      mockUseAuthSession.mockReturnValue(
        createAuthSessionMock({
          isPinUnlockEnabled: true,
          unlockWithPin,
        }),
      )

      renderWithProvider(<UnlockScreen />)

      await act(async () => {
        fireEvent.press(screen.getByTestId('auth-pin-key-9'))
        fireEvent.press(screen.getByTestId('auth-pin-key-9'))
        fireEvent.press(screen.getByTestId('auth-pin-key-9'))
        fireEvent.press(screen.getByTestId('auth-pin-key-9'))
      })

      await waitFor(() => {
        expect(unlockWithPin).toHaveBeenCalledWith('9999')
        expect(
          screen.getByTestId('auth-pin-dot-1').props.accessibilityLabel,
        ).toBe('Erro no dígito 1 de 4 do PIN')
        expect(
          screen.getByTestId('auth-pin-dot-2').props.accessibilityLabel,
        ).toBe('Erro no dígito 2 de 4 do PIN')
        expect(
          screen.getByTestId('auth-pin-dot-3').props.accessibilityLabel,
        ).toBe('Erro no dígito 3 de 4 do PIN')
        expect(
          screen.getByTestId('auth-pin-dot-4').props.accessibilityLabel,
        ).toBe('Erro no dígito 4 de 4 do PIN')
        expect(screen.queryByTestId('auth-error-text')).toBeNull()
        expect(
          screen.queryByTestId('auth-unlock-login-again-button'),
        ).toBeNull()
      })
    },
  )

  it('uses a delete-specific accessibility label on the delete key', () => {
    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isPinUnlockEnabled: true,
      }),
    )

    renderWithProvider(<UnlockScreen />)

    expect(
      screen.getByTestId('auth-pin-delete-button').props.accessibilityLabel,
    ).toBe('Apagar o último dígito do PIN')
  })

  it('clears the PIN failure feedback when the user starts entering a new PIN', async () => {
    const unlockWithPin = jest
      .fn()
      .mockResolvedValueOnce({
        reason: 'invalid-pin',
        success: false,
      })
      .mockResolvedValueOnce({
        success: true,
      })

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isPinUnlockEnabled: true,
        unlockWithPin,
      }),
    )

    renderWithProvider(<UnlockScreen />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-pin-key-9'))
      fireEvent.press(screen.getByTestId('auth-pin-key-9'))
      fireEvent.press(screen.getByTestId('auth-pin-key-9'))
      fireEvent.press(screen.getByTestId('auth-pin-key-9'))
    })

    await waitFor(() => {
      expect(
        screen.getByTestId('auth-pin-dot-1').props.accessibilityLabel,
      ).toBe('Erro no dígito 1 de 4 do PIN')
    })

    fireEvent.press(screen.getByTestId('auth-pin-key-1'))

    expect(screen.getByTestId('auth-pin-dot-1').props.accessibilityLabel).toBe(
      'Dígito 1 de 4 do PIN introduzido',
    )
  })

  it('lets the user delete a digit before submitting the PIN', async () => {
    const unlockWithPin = jest.fn().mockResolvedValue({
      success: true,
    })

    mockUseAuthSession.mockReturnValue(
      createAuthSessionMock({
        isPinUnlockEnabled: true,
        unlockWithPin,
      }),
    )

    renderWithProvider(<UnlockScreen />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('auth-pin-key-1'))
      fireEvent.press(screen.getByTestId('auth-pin-key-2'))
      fireEvent.press(screen.getByTestId('auth-pin-delete-button'))
      fireEvent.press(screen.getByTestId('auth-pin-key-3'))
      fireEvent.press(screen.getByTestId('auth-pin-key-4'))
      fireEvent.press(screen.getByTestId('auth-pin-key-5'))
    })

    await waitFor(() => {
      expect(unlockWithPin).toHaveBeenCalledWith('1345')
    })
  })

  it('closes back to the login page', () => {
    renderWithProvider(<UnlockScreen />)

    fireEvent.press(screen.getByTestId('auth-unlock-close-button'))

    expect(mockRouterReplace).toHaveBeenCalledWith({
      params: {
        showLogin: '1',
      },
      pathname: authRoutes.index,
    })
    expect(screen.queryByTestId('auth-unlock-login-button')).toBeNull()
  })
})
