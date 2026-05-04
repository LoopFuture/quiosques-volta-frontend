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
import { profileRoutes } from '@/features/profile/routes'
import { i18n } from '@/i18n'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

const {
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
  __mockUsePathname: mockUsePathname,
} = jest.requireMock('expo-router')

describe('ProfilePaymentsScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
    mockUseLocalSearchParams.mockReturnValue({})
    mockUsePathname.mockReturnValue(profileRoutes.payments)
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

    renderWithProvider(<ProfilePaymentsScreen />)

    expect(
      screen.getByTestId('profile-payments-screen-error-state'),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByTestId('profile-payments-screen-error-state-retry-button'),
    )

    expect(mockRouterReplace).toHaveBeenCalledWith(profileRoutes.payments)
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

    const ibanField = screen.getByLabelText(
      i18n.t('tabScreens.profile.payments.ibanLabel'),
    )

    expect(screen.getByDisplayValue('Joao Ferreira')).toBeTruthy()
    fireEvent.changeText(ibanField, 'PT50 0002 0123 1234 5678 9015 4')
    expect(ibanField).toHaveProp('value', 'PT50 0002 0123 1234 5678 9015 4')
    fireEvent.press(screen.getByTestId('profile-payments-save-button'))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          payoutAccount: {
            accountHolderName: 'Joao Ferreira',
            iban: 'PT50000201231234567890154',
            rail: 'sepa',
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

    expect(screen.getByDisplayValue('Joao Ferreira')).toBeTruthy()
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

  it('shows the current masked IBAN explicitly instead of as placeholder-only state', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })

    renderWithProvider(<ProfilePaymentsScreen />)

    expect(
      screen.getByText(
        i18n.t('tabScreens.profile.payments.currentIbanHelper', {
          iban: 'PT50************0154',
        }),
      ),
    ).toBeTruthy()

    windowSpy.mockRestore()
  })
})
