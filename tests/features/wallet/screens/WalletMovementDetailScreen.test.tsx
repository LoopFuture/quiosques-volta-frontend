import {
  failedTransferMovement,
  mockRouterPush,
  mockUseLocalSearchParams,
  mockUseWalletMovementDetailQuery,
  resetWalletDetailScreenMocks,
  restoreWalletDetailScreenLocale,
} from '@tests/support/wallet-detail-screen-mocks'
import { fireEvent, screen } from '@testing-library/react-native'
import WalletMovementDetailScreen from '@/features/wallet/screens/WalletMovementDetailScreen'
import { walletRoutes } from '@/features/wallet/routes'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('WalletMovementDetailScreen', () => {
  beforeEach(() => {
    resetWalletDetailScreenMocks()
  })

  afterAll(() => {
    restoreWalletDetailScreenLocale()
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
})
