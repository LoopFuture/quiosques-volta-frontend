import * as WebBrowser from 'expo-web-browser'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import ProfileScreen from '@/features/profile/screens/ProfileScreen'
import { profileResponseSchema } from '@/features/profile/models'
import { authRoutes } from '@/features/auth/routes'
import { PROFILE_LEGAL_LINK_PATHS } from '@/features/profile/constants'
import { profileRoutes } from '@/features/profile/routes'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/auth/biometrics', () => ({
  useBiometricHardwareAvailability: jest.fn(),
}))

jest.mock('@/features/auth/hooks/useAuthSession', () => ({
  useAuthSession: jest.fn(),
}))

jest.mock('@/hooks/useAppPreferences', () => ({
  useAppPreferences: jest.fn(),
}))

jest.mock('@/features/profile/hooks', () => ({
  useDevicePrivacySettings: jest.fn(),
  useProfileQuery: jest.fn(),
}))

const {
  __mockRouterPush: mockRouterPush,
  __mockRouterReplace: mockRouterReplace,
} = jest.requireMock('expo-router')
const {
  useBiometricHardwareAvailability: mockUseBiometricHardwareAvailability,
} = jest.requireMock('@/features/auth/biometrics')
const { useAuthSession: mockUseAuthSession } = jest.requireMock(
  '@/features/auth/hooks/useAuthSession',
)
const { useAppPreferences: mockUseAppPreferences } = jest.requireMock(
  '@/hooks/useAppPreferences',
)
const {
  useDevicePrivacySettings: mockUseDevicePrivacySettings,
  useProfileQuery: mockUseProfileQuery,
} = jest.requireMock('@/features/profile/hooks')

const profileState = profileResponseSchema.parse({
  memberSince: '2023-04-01',
  onboarding: {
    completedAt: '2023-04-02T08:00:00.000Z',
    status: 'completed',
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
    alertsEnabled: false,
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

const profileStateWithPayoutAccount = profileResponseSchema.parse({
  ...profileState,
  payoutAccount: {
    accountHolderName: 'Joao Ferreira',
    ibanMasked: 'PT50************4321',
    rail: 'sepa',
  },
})

const readyProfileStateWithPayoutAccount = profileResponseSchema.parse({
  ...profileStateWithPayoutAccount,
  preferences: {
    alertsEmail: 'joao@volta.pt',
    alertsEnabled: true,
  },
})

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')

    mockUseBiometricHardwareAvailability.mockReturnValue(true)
    mockUseAuthSession.mockReturnValue({
      signOut: jest.fn().mockResolvedValue(undefined),
    })
    mockUseAppPreferences.mockReturnValue({
      languageMode: 'system',
      resolvedLocale: 'pt',
      resolvedTheme: 'light',
      setLanguageMode: jest.fn(),
      setThemeMode: jest.fn(),
      themeMode: 'system',
    })
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: false,
        pinEnabled: false,
        pushNotificationsEnabled: false,
      },
    })
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the loading skeleton while the profile query is pending', () => {
    renderWithProvider(<ProfileScreen />)

    expect(screen.getByTestId('profile-screen-skeleton')).toBeTruthy()
  })

  it('renders the error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<ProfileScreen />)

    expect(screen.getByTestId('profile-screen-error-state')).toBeTruthy()

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the hub and routes readiness, section, help, and logout actions', async () => {
    const signOut = jest.fn().mockResolvedValue(undefined)
    const openBrowserAsync = jest.spyOn(WebBrowser, 'openBrowserAsync')

    mockUseAuthSession.mockReturnValue({
      signOut,
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileScreen />)

    expect(screen.getByTestId('profile-screen')).toBeTruthy()
    expect(
      screen.getByText(i18n.t('tabScreens.profile.hub.supportLabel')),
    ).toBeTruthy()
    expect(
      screen.getByText(i18n.t('tabScreens.profile.hub.helpLinksDescription')),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.cards.personal')),
    )
    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.cards.alerts')),
    )
    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.cards.privacy')),
    )
    fireEvent.press(
      screen.getAllByLabelText(
        i18n.t('tabScreens.profile.hub.cards.payments'),
      )[0]!,
    )
    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.cards.appSettings')),
    )
    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.helpRowLabel')),
    )
    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.hub.rows.helpCenterTitle'),
      ),
    )
    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.profile.hub.rows.privacyPolicyTitle'),
      ),
    )
    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.profile.hub.rows.termsTitle')),
    )
    fireEvent.press(screen.getByTestId('profile-logout-button'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, profileRoutes.personal)
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, profileRoutes.alerts)
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, profileRoutes.privacy)
    expect(mockRouterPush).toHaveBeenNthCalledWith(4, profileRoutes.payments)
    expect(mockRouterPush).toHaveBeenNthCalledWith(5, profileRoutes.appSettings)
    expect(mockRouterPush).toHaveBeenNthCalledWith(6, profileRoutes.help)
    expect(openBrowserAsync).toHaveBeenNthCalledWith(
      1,
      `https://volta.example.com${PROFILE_LEGAL_LINK_PATHS.helpCenter}`,
    )
    expect(openBrowserAsync).toHaveBeenNthCalledWith(
      2,
      `https://volta.example.com${PROFILE_LEGAL_LINK_PATHS.privacyPolicy}`,
    )
    expect(openBrowserAsync).toHaveBeenNthCalledWith(
      3,
      `https://volta.example.com${PROFILE_LEGAL_LINK_PATHS.termsAndConditions}`,
    )

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1)
      expect(mockRouterReplace).toHaveBeenCalledWith(authRoutes.index)
    })
  })

  it('renders the account holder in the payments preview surfaces', () => {
    mockUseDevicePrivacySettings.mockReturnValue({
      settings: {
        biometricsEnabled: true,
        pinEnabled: false,
        pushNotificationsEnabled: true,
      },
    })
    mockUseProfileQuery.mockReturnValue({
      data: readyProfileStateWithPayoutAccount,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<ProfileScreen />)

    expect(
      screen.getAllByText(
        i18n.t('tabScreens.profile.hub.rows.accountHolderNameTitle'),
      ),
    ).toHaveLength(1)
    expect(screen.getAllByText('Joao Ferreira').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(i18n.t('tabScreens.profile.hub.rows.ibanTitle')),
    ).toHaveLength(1)
    expect(screen.getByText('PT50************4321')).toBeTruthy()
  })
})
