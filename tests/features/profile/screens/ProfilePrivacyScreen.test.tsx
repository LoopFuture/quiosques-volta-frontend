import { Linking } from 'react-native'
import {
  mockAuthenticateWithAvailableBiometrics,
  mockRequestPushPermissionAndToken,
  mockSetSettings,
  mockShowError,
  mockShowSuccess,
  mockUseDevicePrivacySettings,
  mockUseProfileQuery,
  mockUsePushNotifications,
  mockUseUpdateProfilePreferencesMutation,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfilePrivacyScreen } from '@/features/profile/screens/ProfilePrivacyScreen'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfilePrivacyScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
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
      expect(mockRequestPushPermissionAndToken).toHaveBeenCalledTimes(1)
      expect(mockAuthenticateWithAvailableBiometrics).toHaveBeenCalledWith({
        cancelLabel: i18n.t('auth.lock.cancelLabel'),
        promptMessage: i18n.t('auth.lock.promptMessage'),
      })
    })

    expect(mockSetSettings).toHaveBeenCalledWith({
      biometricsEnabled: false,
      pushNotificationsEnabled: true,
    })
    expect(mockSetSettings).toHaveBeenCalledWith({
      biometricsEnabled: true,
      pushNotificationsEnabled: false,
    })
  })

  it('shows unavailable push and failed biometric toasts', async () => {
    mockRequestPushPermissionAndToken.mockResolvedValue({
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
      setSettings: mockSetSettings,
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
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      })
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      })
      expect(mockRequestPushPermissionAndToken).not.toHaveBeenCalled()
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
      setSettings: mockSetSettings,
    })
    mockUsePushNotifications.mockReturnValue({
      canAskAgain: false,
      expoPushToken: null,
      isPhysicalDevice: true,
      isSyncing: false,
      permissionStatus: 'denied',
      registrationErrorCode: null,
      requestPushPermissionAndToken: mockRequestPushPermissionAndToken,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
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
})
