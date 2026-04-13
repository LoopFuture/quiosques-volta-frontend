import { Linking } from 'react-native'
import {
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
import { ProfileAlertsScreen } from '@/features/profile/screens/ProfileAlertsScreen'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileAlertsScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
  })

  it('renders the alerts skeleton while the profile query is pending', () => {
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileAlertsScreen />)

    expect(screen.getByTestId('profile-alerts-screen-skeleton')).toBeTruthy()
  })

  it('renders the alerts error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<ProfileAlertsScreen />)

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

    renderWithProvider(<ProfileAlertsScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.alerts.emailAlertsLabel'),
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
      i18n.t('tabScreens.profile.alerts.emailAlertsLabel'),
      i18n.t('tabScreens.profile.alerts.emailAlertsSuccessToast'),
    )
  })

  it('updates device settings for push notifications', async () => {
    renderWithProvider(<ProfileAlertsScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.alerts.pushNotificationsLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockRequestPushPermissionAndToken).toHaveBeenCalledTimes(1)
    })

    expect(mockSetSettings).toHaveBeenCalledWith({
      biometricsEnabled: false,
      pinEnabled: false,
      pushNotificationsEnabled: true,
    })
  })

  it('shows the unavailable push toast', async () => {
    mockRequestPushPermissionAndToken.mockResolvedValue({
      isEnabled: false,
    })

    renderWithProvider(<ProfileAlertsScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.alerts.pushNotificationsLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.alerts.pushNotificationsLabel'),
        i18n.t('tabScreens.profile.privacy.pushNotificationsUnavailableToast'),
      )
    })
  })

  it('allows the user to disable previously enabled push alerts on the device', async () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: true,
      },
      setSettings: mockSetSettings,
    })

    renderWithProvider(<ProfileAlertsScreen />)

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.alerts.pushNotificationsLabel'),
      ),
    )

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      })
      expect(mockRequestPushPermissionAndToken).not.toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.profile.alerts.pushNotificationsLabel'),
        i18n.t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
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
        pinEnabled: false,
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

    renderWithProvider(<ProfileAlertsScreen />)

    await waitFor(() => {
      expect(mockSetSettings).toHaveBeenCalledWith({
        biometricsEnabled: false,
        pinEnabled: false,
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
