import {
  mockShowError,
  mockShowSuccess,
  mockUseProfileQuery,
  mockUseUpdateProfilePaymentsMutation,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfilePaymentsScreen } from '@/features/profile/screens/ProfilePaymentsScreen'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfilePaymentsScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
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
})
