import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import WalletTransferScreen from '@/features/wallet/screens/WalletTransferScreen'
import { profileResponseSchema } from '@/features/profile/models'
import { walletResponseSchema } from '@/features/wallet/models'
import { walletRoutes } from '@/features/wallet/routes'
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

jest.mock('@/features/profile/hooks', () => ({
  useProfileQuery: jest.fn(),
}))

jest.mock('@/features/wallet/hooks', () => ({
  useRequestWalletTransferMutation: jest.fn(),
  useWalletOverviewQuery: jest.fn(),
}))

const { __mockRouterReplace: mockRouterReplace } =
  jest.requireMock('expo-router')
const { useProfileQuery: mockUseProfileQuery } = jest.requireMock(
  '@/features/profile/hooks',
)
const {
  useRequestWalletTransferMutation: mockUseRequestWalletTransferMutation,
  useWalletOverviewQuery: mockUseWalletOverviewQuery,
} = jest.requireMock('@/features/wallet/hooks')

const walletOverviewState = walletResponseSchema.parse({
  balance: {
    amountMinor: 470,
    currency: 'EUR',
  },
  recentTransactions: [],
  stats: {
    completedTransfersCount: 0,
    creditsEarned: {
      amountMinor: 0,
      currency: 'EUR',
    },
    processingTransfersCount: 0,
    returnedPackagesCount: 0,
  },
  transferEligibility: {
    canTransfer: true,
    maximumTransfer: {
      amountMinor: 470,
      currency: 'EUR',
    },
    minimumTransfer: {
      amountMinor: 100,
      currency: 'EUR',
    },
    reason: null,
  },
})

const profileState = profileResponseSchema.parse({
  memberSince: '2023-04-01',
  onboarding: {
    completedAt: '2023-04-02T08:00:00.000Z',
    status: 'completed',
  },
  payoutAccount: {
    ibanMasked: 'PT50************4321',
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

function getButtonDisabledState(testID: string) {
  const button = screen.getByTestId(testID)

  return button.props['aria-disabled'] ?? false
}

describe('WalletTransferScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')

    mockUseWalletOverviewQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      refetch: jest.fn(),
    })
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      refetch: jest.fn(),
    })
    mockUseRequestWalletTransferMutation.mockReturnValue({
      isPending: false,
      mutate: jest.fn(),
    })
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the loading skeleton while dependent queries are pending', () => {
    renderWithProvider(<WalletTransferScreen />)

    expect(screen.getByTestId('wallet-transfer-screen-skeleton')).toBeTruthy()
  })

  it('keeps the skeleton visible until both queries resolve', () => {
    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletTransferScreen />)

    expect(screen.getByTestId('wallet-transfer-screen-skeleton')).toBeTruthy()
  })

  it('renders the error state and retries both queries', () => {
    const refetchWallet = jest.fn()
    const refetchProfile = jest.fn()

    mockUseWalletOverviewQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: refetchWallet,
    })
    mockUseProfileQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: refetchProfile,
    })

    renderWithProvider(<WalletTransferScreen />)

    expect(
      screen.getByTestId('wallet-transfer-screen-error-state'),
    ).toBeTruthy()

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetchWallet).toHaveBeenCalledTimes(1)
    expect(refetchProfile).toHaveBeenCalledTimes(1)
  })

  it('fills the full balance, submits the transfer, and routes to the created movement on success', async () => {
    const mutate = jest.fn(
      (
        _request: unknown,
        options?: { onSuccess?: (response: { transferId: string }) => void },
      ) => {
        options?.onSuccess?.({ transferId: 'ffff-1234' })
      },
    )

    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseRequestWalletTransferMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<WalletTransferScreen />)

    expect(screen.getByTestId('wallet-transfer-amount-input').props.value).toBe(
      '',
    )
    expect(getButtonDisabledState('wallet-transfer-submit-button')).toBe(true)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.transfer.fullBalanceActionLabel'),
      ),
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('wallet-transfer-amount-input').props.value,
      ).toBe('4,70')
      expect(getButtonDisabledState('wallet-transfer-submit-button')).toBe(
        false,
      )
    })

    fireEvent.press(screen.getByTestId('wallet-transfer-submit-button'))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        {
          amount: {
            amountMinor: 470,
            currency: 'EUR',
          },
        },
        expect.objectContaining({
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
        }),
      )
      expect(mockShowSuccess).toHaveBeenCalledWith(
        i18n.t('tabScreens.wallet.transfer.actionLabel'),
        i18n.t('tabScreens.wallet.transfer.successToast'),
      )
      expect(mockRouterReplace).toHaveBeenCalledWith(
        walletRoutes.movementDetail('ffff-1234'),
      )
    })
  })

  it('shows an error toast when the transfer request fails', async () => {
    const mutate = jest.fn(
      (
        _request: unknown,
        options?: { onError?: () => void; onSuccess?: () => void },
      ) => {
        options?.onError?.()
      },
    )

    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseProfileQuery.mockReturnValue({
      data: profileState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseRequestWalletTransferMutation.mockReturnValue({
      isPending: false,
      mutate,
    })

    renderWithProvider(<WalletTransferScreen />)

    fireEvent.changeText(
      screen.getByLabelText(
        i18n.t('tabScreens.wallet.transfer.amountFieldLabel'),
      ),
      '1,20',
    )
    fireEvent.press(screen.getByTestId('wallet-transfer-submit-button'))

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        i18n.t('tabScreens.wallet.transfer.actionLabel'),
        i18n.t('tabScreens.wallet.transfer.errorToast'),
      )
    })
  })

  it('renders fallback review values when no payout account is configured', () => {
    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseProfileQuery.mockReturnValue({
      data: {
        ...profileState,
        payoutAccount: null,
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletTransferScreen />)

    expect(
      screen.getByText(i18n.t('tabScreens.wallet.transfer.reviewTitle')),
    ).toBeTruthy()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('wallet-transfer-review-note')).toBeNull()
    expect(
      screen.getByText(i18n.t('tabScreens.wallet.transfer.confirmActionLabel')),
    ).toBeTruthy()
  })

  it('renders SEPA payout review copy when a payout account is configured', () => {
    mockUseWalletOverviewQuery.mockReturnValue({
      data: walletOverviewState,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })
    mockUseProfileQuery.mockReturnValue({
      data: {
        ...profileState,
        payoutAccount: {
          ibanMasked: 'PT50************1234',
          rail: 'sepa',
        },
      },
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletTransferScreen />)

    expect(
      screen.getAllByText(i18n.t('tabScreens.wallet.transfer.payoutMethodSepa'))
        .length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        i18n.t('tabScreens.wallet.transfer.payoutOptionSepaCaption'),
      ).length,
    ).toBeGreaterThan(0)
  })
})
