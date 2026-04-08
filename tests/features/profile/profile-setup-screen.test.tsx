import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfileSetupScreen } from '@/features/profile/screens/ProfileSetupScreen'
import { homeRoutes } from '@/features/home/routes'
import { profileResponseSchema } from '@/features/profile/models'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { mockWindowDimensions } from '../../support/react-native'
import { renderWithProvider } from '../../support/test-utils'

const mockShowError = jest.fn()
const mockShowSuccess = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/app-shell/hooks/useActionToast', () => ({
  useActionToast: jest.fn(() => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
  })),
}))

jest.mock('@/features/auth/biometrics', () => ({
  authenticateWithAvailableBiometrics: jest.fn(),
  useBiometricHardwareAvailability: jest.fn(),
}))

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/features/notifications/hooks', () => ({
  usePushNotifications: jest.fn(),
}))

jest.mock('@/features/profile/hooks', () => ({
  useCompleteProfileSetupMutation: jest.fn(),
  useDevicePrivacySettings: jest.fn(),
  useProfileQuery: jest.fn(),
}))

const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')
const {
  authenticateWithAvailableBiometrics: mockAuthenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability: mockUseBiometricHardwareAvailability,
} = jest.requireMock('@/features/auth/biometrics')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
const { usePushNotifications: mockUsePushNotifications } = jest.requireMock(
  '@/features/notifications/hooks',
)
const {
  useCompleteProfileSetupMutation: mockUseCompleteProfileSetupMutation,
  useDevicePrivacySettings: mockUseDevicePrivacySettings,
  useProfileQuery: mockUseProfileQuery,
} = jest.requireMock('@/features/profile/hooks')

const profileState = profileResponseSchema.parse({
  memberSince: '2023-04-01',
  onboarding: {
    completedAt: null,
    status: 'in_progress',
  },
  payoutAccount: null,
  personal: {
    email: 'joao@volta.pt',
    name: 'Joao Ferreira',
    nif: '123456789',
    phoneNumber: '+351912345678',
  },
  preferences: {
    alertsEmail: 'joao@volta.pt',
    alertsEnabled: true,
  },
  stats: {
    completedTransfersCount: 5,
    creditsEarned: {
      amountMinor: 1250,
      currency: 'EUR',
    },
    processingTransfersCount: 1,
    returnedPackagesCount: 30,
  },
})

describe('ProfileSetupScreen', () => {
  const mutateAsync = jest.fn()
  const requestPushPermissionAndToken = jest.fn()
  const setSettings = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')

    requestPushPermissionAndToken.mockResolvedValue({
      isEnabled: true,
    })
    mutateAsync.mockResolvedValue(undefined)

    mockUseAuthSession.mockReturnValue({
      identity: {
        email: 'joao@volta.pt',
        name: 'Joao Ferreira',
      },
    })
    mockUseBiometricHardwareAvailability.mockReturnValue(true)
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      success: true,
    })
    mockUsePushNotifications.mockReturnValue({
      canAskAgain: true,
      expoPushToken: 'ExponentPushToken[mock-token]',
      isPhysicalDevice: true,
      isSyncing: false,
      permissionStatus: 'granted',
      registrationErrorCode: null,
      requestPushPermissionAndToken,
    })
    mockUseCompleteProfileSetupMutation.mockReturnValue({
      isPending: false,
      mutateAsync,
    })
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pushNotificationsEnabled: false,
      },
      setSettings,
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  async function advanceToSecurityStep() {
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-payments')).toBeTruthy()
    })

    fireEvent.changeText(
      screen.getByLabelText(i18n.t('tabScreens.profile.payments.ibanLabel')),
      'PT50000201231234567890154',
    )
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
    })
  }

  it('advances through setup, saves device preferences, and routes home on success', async () => {
    renderWithProvider(<ProfileSetupScreen />)

    expect(screen.getByTestId('profile-setup-step-personal')).toBeTruthy()

    await advanceToSecurityStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t(
          'tabScreens.profile.setup.steps.security.pushNotificationsLabel',
        ),
      ),
    )

    await waitFor(() => {
      expect(requestPushPermissionAndToken).toHaveBeenCalledTimes(1)
    })

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockAuthenticateWithAvailableBiometrics).toHaveBeenCalledWith({
        cancelLabel: i18n.t('auth.lock.cancelLabel'),
        promptMessage: i18n.t('auth.lock.promptMessage'),
      })
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        snapshot: {
          payments: {
            iban: 'PT50000201231234567890154',
            spinEnabled: false,
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: true,
            pushNotificationsEnabled: true,
          },
        },
      })
      expect(mockRouterReplace).toHaveBeenCalledWith(homeRoutes.index)
    })

    expect(setSettings).toHaveBeenLastCalledWith({
      biometricsEnabled: true,
      pushNotificationsEnabled: true,
    })
    expect(mockShowSuccess).toHaveBeenCalledWith(
      i18n.t('tabScreens.profile.setup.actions.finishLabel'),
      i18n.t('tabScreens.profile.setup.successToast'),
    )
  })

  it('uses the compact footer, lets the user go back, and surfaces submission errors', async () => {
    const windowSpy = mockWindowDimensions({ width: 320 })

    mutateAsync.mockRejectedValue(new Error('setup exploded'))
    mockUseBiometricHardwareAvailability.mockReturnValue(false)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      },
      setSettings,
    })
    mockUsePushNotifications.mockReturnValue({
      canAskAgain: false,
      expoPushToken: null,
      isPhysicalDevice: true,
      isSyncing: false,
      permissionStatus: 'denied',
      registrationErrorCode: null,
      requestPushPermissionAndToken,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    expect(screen.getByTestId('profile-setup-back-button')).toBeTruthy()

    fireEvent.press(screen.getByTestId('profile-setup-back-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-payments')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.setup.actions.finishLabel'),
        i18n.t('tabScreens.profile.setup.submitError'),
      )
      expect(screen.getByText('setup exploded')).toBeTruthy()
    })

    windowSpy.mockRestore()
  })

  it('shows the biometric failure toast when device authentication is rejected', async () => {
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      reason: 'cancelled',
      success: false,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.biometricCancelledToast'),
      )
    })
  })

  it('omits the biometric section without hardware and disables push without requesting permissions again', async () => {
    mockUseBiometricHardwareAvailability.mockReturnValue(false)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    expect(
      screen.queryByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    ).toBeNull()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t(
          'tabScreens.profile.setup.steps.security.pushNotificationsLabel',
        ),
      ),
    )

    await waitFor(() => {
      expect(requestPushPermissionAndToken).not.toHaveBeenCalled()
    })
  })

  it('lets the user disable biometrics after they were previously enabled', async () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pushNotificationsEnabled: false,
      })
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    })
  })

  it('shows the not-enrolled biometric toast when the device has no enrolled biometrics', async () => {
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      reason: 'not-enrolled',
      success: false,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.biometricNotEnrolledToast'),
      )
    })
  })
})
