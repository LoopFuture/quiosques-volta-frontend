import {
  mockUseProfileQuery,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen } from '@testing-library/react-native'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileSummaryScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
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
