import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import WalletMovementDetailScreen from '@/features/wallet/screens/WalletMovementDetailScreen'
import WalletMovementsScreen from '@/features/wallet/screens/WalletMovementsScreen'
import {
  walletTransactionListResponseSchema,
  walletTransactionResponseSchema,
} from '@/features/wallet/models'
import { walletRoutes } from '@/features/wallet/routes'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider } from '../../support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@/features/wallet/hooks', () => ({
  useWalletHistoryQuery: jest.fn(),
  useWalletMovementDetailQuery: jest.fn(),
}))

const {
  __mockRouterBack: mockRouterBack,
  __mockRouterPush: mockRouterPush,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
} = jest.requireMock('expo-router')
const {
  useWalletHistoryQuery: mockUseWalletHistoryQuery,
  useWalletMovementDetailQuery: mockUseWalletMovementDetailQuery,
} = jest.requireMock('@/features/wallet/hooks')
const { __getLastFlashListRef } = jest.requireMock('@shopify/flash-list')

const transferMovement = walletTransactionResponseSchema.parse({
  transaction: {
    amount: {
      amountMinor: -470,
      currency: 'EUR',
    },
    description: 'Transferencia para conta',
    id: 'movement-transfer-1',
    occurredAt: '2026-04-08T10:00:00.000Z',
    status: 'processing',
    transferDetails: {
      expectedArrivalAt: '2026-04-10T10:00:00.000Z',
      failureReason: null,
      payoutAccount: {
        ibanMasked: 'PT50************4321',
        rail: 'spin',
      },
      requestedAt: '2026-04-08T10:00:00.000Z',
    },
    type: 'transfer_debit',
  },
})

const failedTransferMovement = walletTransactionResponseSchema.parse({
  transaction: {
    ...transferMovement.transaction,
    id: 'movement-transfer-2',
    status: 'failed',
    transferDetails: {
      ...transferMovement.transaction.transferDetails,
      failureReason: 'Conta indisponivel',
    },
  },
})

const walletHistoryPage = walletTransactionListResponseSchema.parse({
  items: [
    {
      amount: {
        amountMinor: 30,
        currency: 'EUR',
      },
      creditDetails: {
        locationName: 'Pingo Doce - Afragide',
        packageCount: 6,
      },
      description: 'Credito de devolucao',
      id: 'movement-credit-1',
      occurredAt: '2026-04-08T09:00:00.000Z',
      status: 'completed',
      type: 'credit',
    },
    transferMovement.transaction,
  ],
  pageInfo: {
    endCursor: 'cursor-2',
    hasNextPage: true,
    hasPreviousPage: false,
    startCursor: null,
  },
})

const creditOnlyWalletHistoryPage = walletTransactionListResponseSchema.parse({
  ...walletHistoryPage,
  items: [walletHistoryPage.items[0]!],
  pageInfo: {
    endCursor: null,
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
  },
})

describe('wallet detail and history screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')

    mockUseLocalSearchParams.mockReturnValue({
      movementId: 'movement-transfer-1',
    })
    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: transferMovement,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })
    mockUseWalletHistoryQuery.mockReturnValue({
      data: {
        pageParams: [undefined],
        pages: [walletHistoryPage],
      },
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the movement not-found state when no movement id is available', () => {
    mockUseLocalSearchParams.mockReturnValue({})

    renderWithProvider(<WalletMovementDetailScreen />)

    expect(screen.getByTestId('wallet-movement-not-found-screen')).toBeTruthy()
    expect(
      screen.getAllByText(
        i18n.t('tabScreens.wallet.common.notFoundDescription'),
      ).length,
    ).toBeGreaterThan(0)
  })

  it('renders the movement detail skeleton while the query is pending', () => {
    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    expect(
      screen.getByTestId('wallet-movement-detail-screen-skeleton'),
    ).toBeTruthy()
  })

  it('renders the movement detail error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders a processing transfer timeline', () => {
    renderWithProvider(<WalletMovementDetailScreen />)

    expect(
      screen.getByText(
        i18n.t(
          'tabScreens.wallet.movementDetail.transfer.processing.timelineTitle',
        ),
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.wallet.movementDetail.transfer.processing.footer'),
      ),
    ).toBeTruthy()
  })

  it('renders the retry action for failed transfers and routes back to transfer', () => {
    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: failedTransferMovement,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.movementDetail.transfer.retryActionLabel'),
      ),
    )

    expect(mockRouterPush).toHaveBeenCalledWith(walletRoutes.transfer)
  })

  it('renders the movements skeleton while history is pending', () => {
    mockUseWalletHistoryQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementsScreen />)

    expect(screen.getByTestId('wallet-movements-screen-skeleton')).toBeTruthy()
  })

  it('renders the movements error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseWalletHistoryQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<WalletMovementsScreen />)

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('filters movements, loads more history, refreshes, and routes to the selected movement', async () => {
    const fetchNextPage = jest.fn()
    const refetch = jest.fn().mockResolvedValue(undefined)

    mockUseWalletHistoryQuery.mockReturnValue({
      data: {
        pageParams: [undefined],
        pages: [walletHistoryPage],
      },
      fetchNextPage,
      hasNextPage: true,
      isError: false,
      isFetchingNextPage: false,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<WalletMovementsScreen />)

    fireEvent.press(
      screen.getByText(i18n.t('tabScreens.wallet.filters.transfers')),
    )

    const flashListRef = __getLastFlashListRef()

    expect(flashListRef?.prepareForLayoutAnimationRender).toHaveBeenCalled()
    expect(flashListRef?.scrollToOffset).toHaveBeenCalledWith({
      animated: true,
      offset: 0,
    })

    fireEvent.press(
      screen.getByLabelText(
        i18n.t('tabScreens.wallet.list.transferPendingTitle'),
      ),
    )

    expect(mockRouterPush).toHaveBeenCalledWith(
      walletRoutes.movementDetail('movement-transfer-1'),
    )

    const historyList = screen.getByTestId('wallet-movements-list')

    historyList.props.onEndReached()
    await historyList.props.refreshControl.props.onRefresh()

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the filtered empty state and resets the filter back to all', async () => {
    mockUseWalletHistoryQuery.mockReturnValue({
      data: {
        pageParams: [undefined],
        pages: [creditOnlyWalletHistoryPage],
      },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementsScreen />)

    fireEvent.press(
      screen.getByText(i18n.t('tabScreens.wallet.filters.transfers')),
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          i18n.t('tabScreens.wallet.movementsPage.filteredEmptyStateTitle'),
        ),
      ).toBeTruthy()
    })

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.movementsPage.filteredEmptyStateAction'),
      ),
    )

    await waitFor(() => {
      expect(screen.getByText('Pingo Doce - Afragide')).toBeTruthy()
    })
  })

  it('routes back from the movements screen top bar', () => {
    renderWithProvider(<WalletMovementsScreen />)

    fireEvent.press(
      screen.getByLabelText(i18n.t('tabScreens.wallet.common.backLabel')),
    )

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })
})
