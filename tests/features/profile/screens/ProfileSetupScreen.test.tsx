import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfileSetupScreen } from '@/features/profile/screens/ProfileSetupScreen'
import { homeRoutes } from '@/features/home/routes'
import { profileResponseSchema } from '@/features/profile/models'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

const mockShowError = jest.fn()
const mockShowSuccess = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
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

jest.mock('@/features/auth/pin', () => ({
  clearStoredAppPin: jest.fn(),
  hasStoredAppPin: jest.fn(),
  saveStoredAppPin: jest.fn(),
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
const { hasStoredAppPin: mockHasStoredAppPin } = jest.requireMock(
  '@/features/auth/pin',
)
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
    mockHasStoredAppPin.mockResolvedValue(false)
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
        pinEnabled: false,
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

  async function advanceToNotificationsStep() {
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-payments')).toBeTruthy()
    })

    const ibanField = screen.getByLabelText(
      i18n.t('tabScreens.profile.payments.ibanLabel'),
    )

    fireEvent.changeText(ibanField, 'PT50 0002 0123 1234 5678 9015 4')
    expect(ibanField).toHaveProp('value', 'PT50 0002 0123 1234 5678 9015 4')
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(
        screen.getByTestId('profile-setup-step-notifications'),
      ).toBeTruthy()
    })
  }

  async function advanceToSecurityStep() {
    await advanceToNotificationsStep()

    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
    })
  }

  it('advances through setup, saves device preferences, and routes home on success', async () => {
    renderWithProvider(<ProfileSetupScreen />)

    expect(screen.getByTestId('profile-setup-step-personal')).toBeTruthy()

    await advanceToNotificationsStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t(
          'tabScreens.profile.setup.steps.notifications.pushNotificationsLabel',
        ),
      ),
    )

    await waitFor(() => {
      expect(requestPushPermissionAndToken).toHaveBeenCalledTimes(1)
    })

    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
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
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: true,
            pinEnabled: false,
            pushNotificationsEnabled: true,
          },
          alertsEnabled: true,
        },
      })
      expect(mockRouterReplace).toHaveBeenCalledWith(homeRoutes.index)
    })

    expect(setSettings).toHaveBeenLastCalledWith({
      biometricsEnabled: true,
      pinEnabled: false,
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
        pinEnabled: false,
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
      expect(
        screen.getByTestId('profile-setup-step-notifications'),
      ).toBeTruthy()
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
    })

    windowSpy.mockRestore()
  })

  it('keeps step headings exposed to assistive tech with larger text sizes', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })

    renderWithProvider(<ProfileSetupScreen />)

    expect(
      screen.getByRole('header', {
        name: i18n.t('tabScreens.profile.setup.steps.personal.title'),
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('header', {
        name: i18n.t(
          'tabScreens.profile.setup.steps.personal.contactSectionLabel',
        ),
      }),
    ).toBeTruthy()

    windowSpy.mockRestore()
  })

  it('announces the active step and keeps the verified email block intact with long content', async () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 320 })

    mockUseAuthSession.mockReturnValue({
      identity: {
        email: 'maria.dos.santos.com.uma.morada.muito.comprida+setup@volta.pt',
        name: 'Joao Ferreira',
      },
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileResponseSchema.parse({
        ...profileState,
        personal: {
          ...profileState.personal,
          email:
            'maria.dos.santos.com.uma.morada.muito.comprida+setup@volta.pt',
        },
      }),
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileSetupScreen />)

    expect(
      screen.getByTestId('profile-setup-step-announcement'),
    ).toHaveTextContent(
      new RegExp(
        i18n.t('tabScreens.profile.setup.progressValue', {
          currentStep: 1,
          totalSteps: 4,
        }),
      ),
    )
    expect(
      screen.getByTestId('profile-setup-step-announcement'),
    ).toHaveTextContent(
      new RegExp(i18n.t('tabScreens.profile.setup.steps.personal.title')),
    )
    expect(
      screen.getByText(
        'maria.dos.santos.com.uma.morada.muito.comprida+setup@volta.pt',
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.profile.setup.steps.personal.verifiedBadgeLabel'),
      ),
    ).toBeTruthy()

    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(
        screen.getByTestId('profile-setup-step-announcement'),
      ).toHaveTextContent(
        new RegExp(
          i18n.t('tabScreens.profile.setup.progressValue', {
            currentStep: 2,
            totalSteps: 4,
          }),
        ),
      )
      expect(
        screen.getByTestId('profile-setup-step-announcement'),
      ).toHaveTextContent(
        new RegExp(i18n.t('tabScreens.profile.setup.steps.payments.title')),
      )
    })

    windowSpy.mockRestore()
  })

  it('prefills account holder name from the entered personal name when payments is still blank', async () => {
    mockUseAuthSession.mockReturnValue({
      identity: {
        email: 'joao@volta.pt',
        name: null,
      },
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileResponseSchema.parse({
        ...profileState,
        personal: {
          ...profileState.personal,
          name: null,
        },
      }),
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileSetupScreen />)

    fireEvent.changeText(
      screen.getByLabelText(i18n.t('tabScreens.profile.personal.nameLabel')),
      'Maria Silva',
    )
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-payments')).toBeTruthy()
    })

    expect(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.payments.accountHolderNameLabel'),
      ),
    ).toHaveProp('value', 'Maria Silva')
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

  it.each([
    ['failed', 'tabScreens.profile.privacy.biometricFailedToast'],
    ['not-available', 'tabScreens.profile.privacy.biometricNotAvailableToast'],
  ] as const)(
    'shows the mapped biometric error toast when the result is %s',
    async (reason, messageKey) => {
      mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
        reason,
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
          i18n.t(messageKey),
        )
      })
    },
  )

  it('omits the biometric section without hardware and disables push without requesting permissions again', async () => {
    mockUseBiometricHardwareAvailability.mockReturnValue(false)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: true,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToNotificationsStep()

    fireEvent.press(
      screen.getByLabelText(
        i18n.t(
          'tabScreens.profile.setup.steps.notifications.pushNotificationsLabel',
        ),
      ),
    )

    await waitFor(() => {
      expect(requestPushPermissionAndToken).not.toHaveBeenCalled()
    })

    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
    })

    expect(
      screen.queryByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    ).toBeNull()
    expect(screen.getByTestId('profile-setup-pin-set-button')).toBeTruthy()
  })

  it('lets the user set a PIN during setup and submits it in the snapshot', async () => {
    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(screen.getByTestId('profile-setup-pin-set-button'))
    fireEvent.changeText(
      screen.getByTestId('profile-setup-pin-pin-input'),
      '1234',
    )
    fireEvent.changeText(
      screen.getByTestId('profile-setup-pin-confirm-pin-input'),
      '1234',
    )
    fireEvent.press(screen.getByTestId('profile-setup-pin-save-button'))

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: true,
        pushNotificationsEnabled: false,
      })
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        snapshot: {
          payments: {
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: false,
            pinEnabled: true,
            pushNotificationsEnabled: false,
          },
          alertsEnabled: true,
        },
      })
    })
  })

  it('lets the user remove an existing PIN during setup', async () => {
    mockHasStoredAppPin.mockResolvedValue(true)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: true,
        pushNotificationsEnabled: false,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    fireEvent.press(screen.getByTestId('profile-setup-pin-remove-button'))

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.pinLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    })
  })

  it('shows an existing stored PIN as configured even when the privacy flag is stale', async () => {
    mockHasStoredAppPin.mockResolvedValue(true)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-pin-change-button')).toBeTruthy()
      expect(screen.getByTestId('profile-setup-pin-remove-button')).toBeTruthy()
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: true,
        pushNotificationsEnabled: false,
      })
    })
  })

  it('submits push notifications as disabled when permission is not granted on entry', async () => {
    mockUseBiometricHardwareAvailability.mockReturnValue(false)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: false,
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
    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        snapshot: {
          payments: {
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: false,
            pinEnabled: false,
            pushNotificationsEnabled: false,
          },
          alertsEnabled: true,
        },
      })
    })

    expect(requestPushPermissionAndToken).not.toHaveBeenCalled()
  })

  it('lets the user disable biometrics after they were previously enabled', async () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pinEnabled: false,
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
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    })
  })

  it('clears a stale biometric setup before submitting when the device has no biometric hardware', async () => {
    mockUseBiometricHardwareAvailability.mockReturnValue(false)
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      },
      setSettings,
    })

    renderWithProvider(<ProfileSetupScreen />)

    await advanceToSecurityStep()
    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
      expect(mutateAsync).toHaveBeenCalledWith({
        snapshot: {
          payments: {
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: false,
            pinEnabled: false,
            pushNotificationsEnabled: false,
          },
          alertsEnabled: true,
        },
      })
    })
  })

  it('preserves the email alerts toggle state in the setup snapshot', async () => {
    renderWithProvider(<ProfileSetupScreen />)

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
      expect(
        screen.getByTestId('profile-setup-step-notifications'),
      ).toBeTruthy()
    })

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.setup.steps.notifications.emailAlertsLabel'),
      ),
    )
    fireEvent.press(screen.getByTestId('profile-setup-next-button'))

    await waitFor(() => {
      expect(screen.getByTestId('profile-setup-step-security')).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId('profile-setup-finish-button'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        snapshot: {
          payments: {
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
          },
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
          preferences: {
            biometricsEnabled: false,
            pinEnabled: false,
            pushNotificationsEnabled: false,
          },
          alertsEnabled: false,
        },
      })
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
