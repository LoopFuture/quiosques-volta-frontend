import {
  mockUseProfileQuery,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen } from '@testing-library/react-native'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'
import { profileRoutes } from '@/features/profile/routes'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

const {
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
  __mockUsePathname: mockUsePathname,
} = jest.requireMock('expo-router')

describe('ProfileSummaryScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
    mockUseLocalSearchParams.mockReturnValue({})
    mockUsePathname.mockReturnValue(profileRoutes.summary)
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
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

  it('renders the forced e2e error state and clears it on retry', () => {
    const { __setExpoConfig } = jest.requireMock('expo-constants') as {
      __setExpoConfig: jest.Mock
    }

    __setExpoConfig({
      extra: {
        api: {
          baseUrl: 'https://volta.be.dev.theloop.tech',
        },
        e2e: {
          enabled: true,
        },
        eas: {
          projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
        },
        keycloak: {
          clientId: 'volta-mobile',
          issuerUrl: 'https://keycloak.example.com/realms/volta',
          scopes: ['openid', 'profile', 'email'],
        },
        sentry: {},
        webApp: {
          baseUrl: 'https://volta.example.com',
        },
      },
    })
    mockUseLocalSearchParams.mockReturnValue({
      __e2eQueryState: 'error',
    })

    renderWithProvider(<ProfileSummaryScreen />)

    expect(
      screen.getByTestId('profile-summary-screen-error-state'),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByTestId('profile-summary-screen-error-state-retry-button'),
    )

    expect(mockRouterReplace).toHaveBeenCalledWith(profileRoutes.summary)
  })

  it('renders the summary hero when profile data is available', () => {
    renderWithProvider(<ProfileSummaryScreen />)

    expect(
      screen.getByText(
        i18n.t('tabScreens.profile.summary.sections.hero.title'),
      ),
    ).toBeTruthy()
    expect(screen.getByText(/12,50/)).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.profile.summary.sections.totals.title'),
      ),
    ).toBeTruthy()
  })
})
