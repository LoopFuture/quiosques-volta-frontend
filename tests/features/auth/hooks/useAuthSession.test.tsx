import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import type { AuthSessionContextValue } from '@/features/auth/components/AuthSessionProvider'
import { AuthSessionContext } from '@/features/auth/components/AuthSessionProvider'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'

describe('useAuthSession', () => {
  const sessionValue: AuthSessionContextValue = {
    appLockRevision: 0,
    canAccessProtectedApp: true,
    completeSignIn: jest.fn(),
    consumePendingBiometricPrompt: jest.fn(),
    identity: null,
    isBiometricUnlockEnabled: false,
    isAppLocked: false,
    isAuthenticated: true,
    isPinUnlockEnabled: false,
    session: null,
    signOut: jest.fn(),
    status: 'authenticated',
    unlockWithBiometrics: jest.fn(),
    unlockWithPin: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws when used outside the AuthSessionProvider', () => {
    function MissingProviderHarness() {
      useAuthSession()

      return null
    }

    expect(() => render(<MissingProviderHarness />)).toThrow(
      'useAuthSession must be used within AuthSessionProvider',
    )
  })

  it('returns the current auth session context value', () => {
    function AuthSessionHarness() {
      const { canAccessProtectedApp, isAuthenticated, status } =
        useAuthSession()

      return (
        <Text>{`${status}:${String(isAuthenticated)}:${String(canAccessProtectedApp)}`}</Text>
      )
    }

    const view = render(
      <AuthSessionContext.Provider value={sessionValue}>
        <AuthSessionHarness />
      </AuthSessionContext.Provider>,
    )

    expect(view.getByText('authenticated:true:true')).toBeTruthy()
  })
})
