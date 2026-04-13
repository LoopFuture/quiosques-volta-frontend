import {
  cancelledTransferMovement,
  completedTransferMovement,
  failedTransferMovement,
  mockRouterPush,
  mockRouterReplace,
  mockUseLocalSearchParams,
  mockUseWalletMovementDetailQuery,
  resetWalletDetailScreenMocks,
  restoreWalletDetailScreenLocale,
} from '@tests/support/wallet-detail-screen-mocks'
import { fireEvent, screen } from '@testing-library/react-native'
import * as ReactNative from 'react-native'
import { profileRoutes } from '@/features/profile/routes'
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
      screen.getByText(i18n.t('tabScreens.wallet.common.notFoundDescription')),
    ).toBeTruthy()

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.overview.latestMovements.actionLabel'),
      ),
    )

    expect(mockRouterReplace).toHaveBeenCalledWith(walletRoutes.movements)
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

    expect(
      screen.getAllByText(i18n.t('tabScreens.wallet.movementDetail.errorTitle'))
        .length,
    ).toBeGreaterThan(0)
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

  it('renders the failed transfer reason and routes to payments review', () => {
    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: failedTransferMovement,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    expect(
      screen.getByText(
        i18n.t('tabScreens.wallet.movementDetail.transfer.failed.reasonTitle'),
      ),
    ).toBeTruthy()
    expect(screen.getByText('Conta indisponivel')).toBeTruthy()

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.transfer.reviewDestinationActionLabel'),
      ),
    )

    expect(mockRouterPush).toHaveBeenCalledWith(profileRoutes.payments)
  })

  it('renders the cancelled transfer action and routes back to the transfer flow', () => {
    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: cancelledTransferMovement,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.wallet.transfer.newTransferActionLabel'),
      ),
    )

    expect(mockRouterPush).toHaveBeenCalledWith(walletRoutes.transfer)
  })

  it('shares the receipt for completed transfers', () => {
    const shareSpy = jest
      .spyOn(ReactNative.Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' })

    mockUseWalletMovementDetailQuery.mockReturnValue({
      data: completedTransferMovement,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t(
          'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
        ),
      ),
    )

    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          completedTransferMovement.transaction.id,
        ),
        title: i18n.t(
          'tabScreens.wallet.movementDetail.transfer.completed.receiptActionLabel',
        ),
      }),
    )

    shareSpy.mockRestore()
  })
})
