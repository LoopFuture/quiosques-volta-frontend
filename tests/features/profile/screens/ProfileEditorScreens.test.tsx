import { Linking } from 'react-native'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import {
  ProfileAppSettingsScreen,
  ProfilePaymentsScreen,
  ProfilePersonalScreen,
  ProfilePrivacyScreen,
} from '@/features/profile/screens/ProfileEditorScreens'
import * as ProfileEditorScreens from '@/features/profile/screens/ProfileEditorScreens'
import { ProfileAppSettingsScreen as DirectProfileAppSettingsScreen } from '@/features/profile/screens/ProfileAppSettingsScreen'
import ProfileHelpScreen from '@/features/profile/screens/ProfileHelpScreen'
import { ProfilePaymentsScreen as DirectProfilePaymentsScreen } from '@/features/profile/screens/ProfilePaymentsScreen'
import { ProfilePersonalScreen as DirectProfilePersonalScreen } from '@/features/profile/screens/ProfilePersonalScreen'
import { ProfilePrivacyScreen as DirectProfilePrivacyScreen } from '@/features/profile/screens/ProfilePrivacyScreen'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'
import { profileResponseSchema } from '@/features/profile/models'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
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

jest.mock('@/hooks/useAppPreferences', () => ({
  useAppPreferences: jest.fn(),
}))

jest.mock('@/features/profile/hooks', () => ({
  useDevicePrivacySettings: jest.fn(),
  useProfileQuery: jest.fn(),
  useUpdateProfilePaymentsMutation: jest.fn(),
  useUpdateProfilePersonalMutation: jest.fn(),
  useUpdateProfilePreferencesMutation: jest.fn(),
}))

jest.mock('@/features/auth/biometrics', () => ({
  authenticateWithAvailableBiometrics: jest.fn(),
  useBiometricHardwareAvailability: jest.fn(),
}))

jest.mock('@/features/notifications/hooks', () => ({
  usePushNotifications: jest.fn(),
}))

jest.mock('@/features/onboarding/screens/OnboardingScreen', () => ({
  __esModule: true,
  default: ({ onComplete }: { onComplete: () => void }) => {
    const { Text } = jest.requireActual('react-native')

    return <Text onPress={onComplete}>complete-help</Text>
  },
}))

const { __mockRouterBack: mockRouterBack } = jest.requireMock('expo-router')
const { useAppPreferences: mockUseAppPreferences } = jest.requireMock(
  '@/hooks/useAppPreferences',
)
const {
  useDevicePrivacySettings: mockUseDevicePrivacySettings,
  useProfileQuery: mockUseProfileQuery,
  useUpdateProfilePaymentsMutation: mockUseUpdateProfilePaymentsMutation,
  useUpdateProfilePersonalMutation: mockUseUpdateProfilePersonalMutation,
  useUpdateProfilePreferencesMutation: mockUseUpdateProfilePreferencesMutation,
} = jest.requireMock('@/features/profile/hooks')
const {
  authenticateWithAvailableBiometrics: mockAuthenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability: mockUseBiometricHardwareAvailability,
} = jest.requireMock('@/features/auth/biometrics')
const { usePushNotifications: mockUsePushNotifications } = jest.requireMock(
  '@/features/notifications/hooks',
)

const profileState = profileResponseSchema.parse({
  memberSince: '2023-04-01',
  onboarding: {
    completedAt: '2023-04-02T08:00:00.000Z',
    status: 'completed',
  },
  payoutAccount: {
    ibanMasked: 'PT50************0154',
    rail: 'spin',
  },
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

describe('profile editor and detail screens', () => {
  const setLanguageMode = jest.fn()
  const setThemeMode = jest.fn()
  const setSettings = jest.fn()
  const requestPushPermissionAndToken = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')

    requestPushPermissionAndToken.mockResolvedValue({
      isEnabled: true,
    })

    mockUseAppPreferences.mockReturnValue({
      languageMode: 'system',
      setLanguageMode,
      setThemeMode,
      themeMode: 'system',
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })
    mockUseUpdateProfilePaymentsMutation.mockReturnValue({
      isPending: false,
      mutate: jest.fn(),
    })
    mockUseUpdateProfilePersonalMutation.mockReturnValue({
      isPending: false,
      mutate: jest.fn(),
    })
    mockUseUpdateProfilePreferencesMutation.mockReturnValue({
      isPending: false,
      mutate: jest.fn(),
    })
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pushNotificationsEnabled: false,
      },
      setSettings,
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
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('re-exports the editor screens through the feature barrel', () => {
    expect(ProfileEditorScreens.ProfileAppSettingsScreen).toBe(
      DirectProfileAppSettingsScreen,
    )
    expect(ProfileEditorScreens.ProfilePaymentsScreen).toBe(
      DirectProfilePaymentsScreen,
    )
    expect(ProfileEditorScreens.ProfilePersonalScreen).toBe(
      DirectProfilePersonalScreen,
    )
    expect(ProfileEditorScreens.ProfilePrivacyScreen).toBe(
      DirectProfilePrivacyScreen,
    )
  })

  it('updates appearance and language preferences from app settings', async () => {
    renderWithProvider(<ProfileAppSettingsScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.appSettings.appearance.darkOption'),
      ),
    )
    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.appSettings.language.englishOption'),
      ),
    )

    await waitFor(() => {
      expect(setThemeMode).toHaveBeenCalledWith('dark')
      expect(setLanguageMode).toHaveBeenCalledWith('en')
    })

    expect(mockShowSuccess).toHaveBeenNthCalledWith(
      1,
      i18n.t('tabScreens.profile.appSettings.appearance.title'),
      i18n.t('tabScreens.profile.appSettings.savedToast'),
    )
    expect(mockShowSuccess).toHaveBeenNthCalledWith(
      2,
      i18n.t('tabScreens.profile.appSettings.language.title'),
      i18n.t('tabScreens.profile.appSettings.savedToast'),
    )
  })

  it('renders the payments skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfilePaymentsScreen />)

    expect(screen.getByTestId('profile-payments-screen-skeleton')).toBeTruthy()
  })

  it('renders the payments error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<ProfilePaymentsScreen />)

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('submits updated payment details and shows the success toast', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onSuccess?.()
      },
    )

    mockUseUpdateProfilePaymentsMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePaymentsScreen />)

    fireEvent.changeText(
      screen.getByLabelText(i18n.t('tabScreens.profile.payments.ibanLabel')),
      'PT50000201231234567890154',
    )
    fireEvent.press(screen.getByTestId('profile-payments-save-button'))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          payoutAccount: {
            iban: 'PT50000201231234567890154',
            rail: 'spin',
          },
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    expect(mockShowSuccess).toHaveBeenCalledWith(
      i18n.t('tabScreens.profile.payments.saveLabel'),
      i18n.t('tabScreens.profile.payments.saveSuccessToast'),
    )
  })

  it('shows an error toast when saving payment details fails', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onError?.()
      },
    )

    mockUseUpdateProfilePaymentsMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePaymentsScreen />)

    fireEvent.changeText(
      screen.getByLabelText(i18n.t('tabScreens.profile.payments.ibanLabel')),
      'PT50000201231234567890154',
    )
    fireEvent.press(screen.getByTestId('profile-payments-save-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.payments.saveLabel'),
        i18n.t('tabScreens.profile.payments.saveErrorToast'),
      )
    })
  })

  it('renders the personal details skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfilePersonalScreen />)

    expect(screen.getByTestId('profile-personal-screen-skeleton')).toBeTruthy()
  })

  it('submits updated personal details and shows the success toast', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onSuccess?.()
      },
    )

    mockUseUpdateProfilePersonalMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePersonalScreen />)

    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          personal: {
            email: 'joao@volta.pt',
            name: 'Joao Ferreira',
            nif: '123456789',
            phoneNumber: '+351912345678',
          },
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    expect(mockShowSuccess).toHaveBeenCalledWith(
      i18n.t('tabScreens.profile.personal.saveLabel'),
      i18n.t('tabScreens.profile.personal.saveSuccessToast'),
    )
  })

  it('shows an error toast when saving personal details fails', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onError?.()
      },
    )

    mockUseUpdateProfilePersonalMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePersonalScreen />)

    fireEvent.press(screen.getByTestId('profile-personal-save-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.personal.saveLabel'),
        i18n.t('tabScreens.profile.personal.saveErrorToast'),
      )
    })
  })

  it('renders the privacy skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    expect(screen.getByTestId('profile-privacy-screen-skeleton')).toBeTruthy()
  })

  it('renders the privacy error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('updates account alert preferences and shows the success toast', async () => {
    const mutate = jest.fn(
      (
        _payload: unknown,
        options?: { onSuccess?: () => void; onError?: () => void },
      ) => {
        options?.onSuccess?.()
      },
    )

    mockUseUpdateProfilePreferencesMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.emailAlertsLabel'),
      ),
    )

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          preferences: {
            alertsEmail: 'joao@volta.pt',
            alertsEnabled: false,
          },
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
    })

    expect(mockShowSuccess).toHaveBeenCalledWith(
      i18n.t('tabScreens.profile.privacy.emailAlertsLabel'),
      i18n.t('tabScreens.profile.privacy.emailAlertsSuccessToast'),
    )
  })

  it('updates device settings for push notifications and biometrics', async () => {
    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.pushNotificationsLabel'),
      ),
    )
    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(requestPushPermissionAndToken).toHaveBeenCalledTimes(1)
      expect(mockAuthenticateWithAvailableBiometrics).toHaveBeenCalledWith({
        cancelLabel: i18n.t('auth.lock.cancelLabel'),
        promptMessage: i18n.t('auth.lock.promptMessage'),
      })
    })

    expect(setSettings).toHaveBeenCalledWith({
      biometricsEnabled: false,
      pushNotificationsEnabled: true,
    })
    expect(setSettings).toHaveBeenCalledWith({
      biometricsEnabled: true,
      pushNotificationsEnabled: false,
    })
  })

  it('shows unavailable push and failed biometric toasts', async () => {
    requestPushPermissionAndToken.mockResolvedValue({
      isEnabled: false,
    })
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      reason: 'failed',
      success: false,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.pushNotificationsLabel'),
      ),
    )
    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.pushNotificationsLabel'),
        i18n.t('tabScreens.profile.privacy.pushNotificationsUnavailableToast'),
      )
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.biometricFailedToast'),
      )
    })
  })

  it('allows the user to disable previously enabled privacy toggles on the device', async () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pushNotificationsEnabled: true,
      },
      setSettings,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.pushNotificationsLabel'),
      ),
    )
    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      })
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      })
      expect(requestPushPermissionAndToken).not.toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.pushNotificationsLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    })
  })

  it('shows the not-enrolled biometric toast in privacy settings', async () => {
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      reason: 'not-enrolled',
      success: false,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

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

  it('resets blocked push notifications on mount and opens system settings', async () => {
    const openSettingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue()

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

    renderWithProvider(<ProfilePrivacyScreen />)

    await waitFor(() => {
      expect(setSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pushNotificationsEnabled: false,
      })
    })

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.privacy.pushNotificationsOpenSettingsLabel'),
      ),
    )

    expect(openSettingsSpy).toHaveBeenCalledTimes(1)

    openSettingsSpy.mockRestore()
  })

  it('renders the summary skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileSummaryScreen />)

    expect(screen.getByTestId('profile-summary-screen-skeleton')).toBeTruthy()
  })

  it('renders the summary error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<ProfileSummaryScreen />)

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the summary hero when profile data is available', () => {
    renderWithProvider(<ProfileSummaryScreen />)

    expect(
      screen.getByText(
        i18n.t('tabScreens.profile.summary.sections.hero.title'),
      ),
    ).toBeTruthy()
    expect(screen.getByText(/12,50/)).toBeTruthy()
  })

  it('completes the help flow and navigates back', () => {
    renderWithProvider(<ProfileHelpScreen />)

    fireEvent.press(screen.getByText('complete-help'))

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })
})
