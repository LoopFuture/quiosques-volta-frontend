import {
  mockAuthenticateWithAvailableBiometrics,
  mockSetSettings,
  mockShowError,
  mockShowSuccess,
  mockUseBiometricHardwareAvailability,
  mockUseDevicePrivacySettings,
  mockUseProfileQuery,
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

  it('updates device settings for biometrics', async () => {
    renderWithProvider(<ProfilePrivacyScreen />)

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

    expect(mockSetSettings).toHaveBeenCalledWith({
      biometricsEnabled: true,
      pinEnabled: false,
      pushNotificationsEnabled: false,
    })
  })

  it('shows a failed biometric toast', async () => {
    mockAuthenticateWithAvailableBiometrics.mockResolvedValue({
      reason: 'failed',
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
        i18n.t('tabScreens.profile.privacy.biometricFailedToast'),
      )
    })
  })

  it('allows the user to disable previously enabled device security toggles', async () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: true,
      },
      setSettings: mockSetSettings,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: true,
      })
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

  it('lets the user set and remove a PIN from privacy settings', async () => {
    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(screen.getByTestId('profile-privacy-pin-set-button'))
    fireEvent.changeText(
      screen.getByTestId('profile-privacy-pin-pin-input'),
      '1234',
    )
    fireEvent.changeText(
      screen.getByTestId('profile-privacy-pin-confirm-pin-input'),
      '1234',
    )
    fireEvent.press(screen.getByTestId('profile-privacy-pin-save-button'))

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: true,
        pushNotificationsEnabled: false,
      })
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.privacy.pinLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    })

    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: true,
        pushNotificationsEnabled: false,
      },
      setSettings: mockSetSettings,
    })

    renderWithProvider(<ProfilePrivacyScreen />)

    fireEvent.press(screen.getByTestId('profile-privacy-pin-remove-button'))

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
    })
  })

  it('hides biometrics but keeps PIN controls available when the device has no biometric hardware', () => {
    mockUseBiometricHardwareAvailability.mockReturnValue(false)

    renderWithProvider(<ProfilePrivacyScreen />)

    expect(
      screen.queryByLabelText(
        i18n.t('tabScreens.profile.privacy.biometricLabel'),
      ),
    ).toBeNull()
    expect(screen.getByTestId('profile-privacy-pin-set-button')).toBeTruthy()
  })
})
