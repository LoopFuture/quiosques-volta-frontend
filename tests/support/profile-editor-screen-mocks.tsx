import { profileResponseSchema } from '@/features/profile/models'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'

export const mockShowError = jest.fn()
export const mockShowSuccess = jest.fn()
export const mockSetLanguageMode = jest.fn()
export const mockSetThemeMode = jest.fn()
export const mockSetSettings = jest.fn()
export const mockRequestPushPermissionAndToken = jest.fn()

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

export const { __mockRouterBack: mockRouterBack } =
  jest.requireMock('expo-router')
export const { useAppPreferences: mockUseAppPreferences } = jest.requireMock(
  '@/hooks/useAppPreferences',
)
export const {
  useDevicePrivacySettings: mockUseDevicePrivacySettings,
  useProfileQuery: mockUseProfileQuery,
  useUpdateProfilePaymentsMutation: mockUseUpdateProfilePaymentsMutation,
  useUpdateProfilePersonalMutation: mockUseUpdateProfilePersonalMutation,
  useUpdateProfilePreferencesMutation: mockUseUpdateProfilePreferencesMutation,
} = jest.requireMock('@/features/profile/hooks')
export const {
  authenticateWithAvailableBiometrics: mockAuthenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability: mockUseBiometricHardwareAvailability,
} = jest.requireMock('@/features/auth/biometrics')
export const { usePushNotifications: mockUsePushNotifications } =
  jest.requireMock('@/features/notifications/hooks')

export const profileState = profileResponseSchema.parse({
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

export function resetProfileEditorScreenMocks() {
  jest.clearAllMocks()
  setLocaleOverrideForTests('pt-PT')
  syncLocale('system')

  mockRequestPushPermissionAndToken.mockResolvedValue({
    isEnabled: true,
  })

  mockUseAppPreferences.mockReturnValue({
    languageMode: 'system',
    setLanguageMode: mockSetLanguageMode,
    setThemeMode: mockSetThemeMode,
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
      pinEnabled: false,
      pushNotificationsEnabled: false,
    },
    setSettings: mockSetSettings,
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
    requestPushPermissionAndToken: mockRequestPushPermissionAndToken,
  })
}

export function restoreProfileEditorScreenLocale() {
  setLocaleOverrideForTests('pt-PT')
  syncLocale('system')
}
