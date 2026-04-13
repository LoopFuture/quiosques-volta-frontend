import {
  __getLastFlashListRef,
  creditOnlyWalletHistoryPage,
  mockRouterBack,
  mockRouterPush,
  mockUseWalletHistoryQuery,
  resetWalletDetailScreenMocks,
  restoreWalletDetailScreenLocale,
  walletHistoryPage,
} from '@tests/support/wallet-detail-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import {
  getWalletMovementAccessibilityLabel,
  getWalletMovementDateHeading,
} from '@/features/wallet/presentation'
import WalletMovementsScreen from '@/features/wallet/screens/WalletMovementsScreen'
import { walletRoutes } from '@/features/wallet/routes'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('WalletMovementsScreen', () => {
  beforeEach(() => {
    resetWalletDetailScreenMocks()
  })

  afterAll(() => {
    restoreWalletDetailScreenLocale()
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

    expect(
      screen.getByText(
        getWalletMovementDateHeading(
          i18n.language,
          walletHistoryPage.items[0]!,
        ),
      ),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByText(i18n.t('tabScreens.wallet.filters.transfers')),
    )

    const flashListRef = __getLastFlashListRef()

    expect(flashListRef?.scrollToOffset).toHaveBeenCalledWith({
      animated: true,
      offset: 0,
    })

    fireEvent.press(
      screen.getByLabelText(
        getWalletMovementAccessibilityLabel(
          i18n.t.bind(i18n),
          i18n.language,
          walletHistoryPage.items[1]!,
        ),
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
