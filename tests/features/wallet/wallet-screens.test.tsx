import { act, fireEvent, screen } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { LayoutAnimation } from 'react-native'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { getMockProfileState } from '@/features/app-data/mock'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import WalletMovementDetailScreen from '@/features/wallet/screens/WalletMovementDetailScreen'
import WalletMovementsScreen from '@/features/wallet/screens/WalletMovementsScreen'
import WalletScreen from '@/features/wallet/screens/WalletScreen'
import WalletTransferScreen from '@/features/wallet/screens/WalletTransferScreen'
import { renderWithProvider, resolveMockApi } from '../../support/test-utils'

const mockShowToast = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '../../support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

const {
  __mockRouterPush: mockRouterPush,
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
} = jest.requireMock('expo-router')
const { __getLastFlashListRef } = jest.requireMock('@shopify/flash-list')

function getButtonDisabledState(testID: string) {
  const button = screen.getByTestId(testID)

  return button.props['aria-disabled'] ?? false
}

function getSelectableState(testID: string) {
  const item = screen.getByTestId(testID)

  return {
    disabled: item.props.accessibilityState?.disabled ?? false,
    selected: item.props.accessibilityState?.selected ?? false,
  }
}

describe('wallet screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseLocalSearchParams.mockReturnValue({})
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders the wallet overview with backend recent transactions', async () => {
    renderWithProvider(<WalletScreen />)

    expect(screen.getByTestId('wallet-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(screen.getByTestId('wallet-screen')).toBeTruthy()
    expect(screen.getByText('Saldo disponível')).toBeTruthy()
    expect(screen.queryByText('Garrafas devolvidas')).toBeNull()
    expect(screen.queryByText('Transferências em curso')).toBeNull()
    expect(screen.getByText('Histórico recente')).toBeTruthy()
    expect(screen.getByText('Pingo Doce - Afragide')).toBeTruthy()
    expect(screen.getAllByText('Transfer').length).toBeGreaterThan(0)
  })

  it('routes wallet overview actions to transfer, full history, and movement detail', async () => {
    renderWithProvider(<WalletScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByText('Transferir saldo'))
    fireEvent.press(screen.getByText('Ver histórico completo'))
    fireEvent.press(screen.getByLabelText('Pingo Doce - Afragide'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, '/wallet/transfer')
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, '/wallet/movements')
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, {
      params: {
        movementId: '11111111-1111-4111-8111-111111111111',
      },
      pathname: '/wallet/[movementId]',
    })
  })

  it('shows a compact empty overview when the wallet has no balance or recent activity', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/wallet`, () =>
        HttpResponse.json({
          balance: {
            amountMinor: 0,
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
            canTransfer: false,
            maximumTransfer: {
              amountMinor: 0,
              currency: 'EUR',
            },
            minimumTransfer: {
              amountMinor: 1,
              currency: 'EUR',
            },
            reason: null,
          },
        }),
      ),
    )

    renderWithProvider(<WalletScreen />)

    await resolveMockApi()

    expect(screen.queryByText('Transferir saldo')).toBeNull()
    expect(screen.getByText('Sem saldo para transferir')).toBeTruthy()
    expect(screen.getByText('Ainda não tens movimentos recentes')).toBeTruthy()
    expect(
      screen.getByText(
        'Depois da tua próxima devolução, os créditos e as transferências vão aparecer aqui.',
      ),
    ).toBeTruthy()
  })

  it('renders the transfer screen with visible SPIN, SEPA selected, and a disabled submit button', async () => {
    renderWithProvider(<WalletTransferScreen />)

    expect(screen.getByTestId('wallet-transfer-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(screen.getByTestId('wallet-transfer-screen')).toBeTruthy()
    expect(screen.getByTestId('wallet-transfer-amount-input').props.value).toBe(
      '',
    )
    expect(
      getSelectableState('wallet-transfer-payout-option-spin'),
    ).toStrictEqual({
      disabled: true,
      selected: false,
    })
    expect(
      getSelectableState('wallet-transfer-payout-option-sepa'),
    ).toStrictEqual({
      disabled: false,
      selected: true,
    })
    expect(
      screen.getAllByText('Pagamento imediato SPIN').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Transferência SEPA').length).toBeGreaterThan(0)
    expect(screen.getByText('Indisponível')).toBeTruthy()
    expect(getButtonDisabledState('wallet-transfer-submit-button')).toBe(true)
  })

  it('enables the spin payout option when profile data allows it', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/profile`, async () => {
        const profile = await getMockProfileState()

        return HttpResponse.json({
          ...profile,
          payoutAccount: {
            ...profile.payoutAccount,
            spinEnabled: true,
          },
        })
      }),
    )

    renderWithProvider(<WalletTransferScreen />)

    await resolveMockApi()

    expect(
      getSelectableState('wallet-transfer-payout-option-spin'),
    ).toStrictEqual({
      disabled: false,
      selected: false,
    })

    fireEvent.press(screen.getByTestId('wallet-transfer-payout-option-spin'))

    expect(
      getSelectableState('wallet-transfer-payout-option-spin'),
    ).toStrictEqual({
      disabled: false,
      selected: true,
    })
    expect(
      screen.getAllByText('Pagamento imediato SPIN').length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        'Receber logo que o pagamento imediato estiver disponível.',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('routes to the new movement detail after requesting a transfer', async () => {
    renderWithProvider(<WalletTransferScreen />)

    await resolveMockApi()

    fireEvent.changeText(
      screen.getByLabelText('Quanto queres transferir?'),
      '1,20',
    )
    fireEvent.press(screen.getByTestId('wallet-transfer-submit-button'))

    await act(async () => {
      await Promise.resolve()
    })

    await resolveMockApi(2)

    expect(mockShowToast).toHaveBeenCalledWith(
      'Pedir transferência',
      expect.objectContaining({
        duration: 3500,
        message: 'O pedido de transferência foi enviado.',
        variant: 'success',
      }),
    )
    expect(mockRouterReplace).toHaveBeenCalledWith({
      params: {
        movementId: expect.stringMatching(/^ffff/),
      },
      pathname: '/wallet/[movementId]',
    })
  })

  it('filters the history page by type and keeps rows tappable', async () => {
    const layoutAnimationSpy = jest.spyOn(LayoutAnimation, 'configureNext')

    renderWithProvider(<WalletMovementsScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Transferências'))

    expect(
      __getLastFlashListRef()?.prepareForLayoutAnimationRender,
    ).toHaveBeenCalledTimes(1)
    expect(__getLastFlashListRef()?.scrollToOffset).toHaveBeenCalledWith({
      animated: true,
      offset: 0,
    })
    expect(layoutAnimationSpy).toHaveBeenCalledWith(
      LayoutAnimation.Presets.easeInEaseOut,
    )
    expect(screen.queryByText('Pingo Doce - Afragide')).toBeNull()

    expect(screen.getAllByText(/PT50\*+\d+/).length).toBeGreaterThan(0)

    fireEvent.press(screen.getAllByLabelText('Transferência em curso')[0]!)

    expect(mockRouterPush).toHaveBeenCalledWith({
      params: {
        movementId: '22222222-2222-4222-8222-222222222222',
      },
      pathname: '/wallet/[movementId]',
    })
  })

  it('shows a filtered empty state and lets users reset the filter', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/wallet/transactions`, () =>
        HttpResponse.json({
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
              id: '11111111-1111-4111-8111-111111111111',
              occurredAt: '2026-03-14T14:30:00Z',
              status: 'completed',
              type: 'credit',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            nextCursor: null,
          },
        }),
      ),
    )

    renderWithProvider(<WalletMovementsScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Transferências'))

    expect(screen.getByText('Este filtro não tem movimentos')).toBeTruthy()
    expect(
      screen.getByText(
        'Experimenta outro filtro para veres o resto do histórico da carteira.',
      ),
    ).toBeTruthy()

    fireEvent.press(screen.getByText('Ver todos os movimentos'))

    expect(screen.getByText('Pingo Doce - Afragide')).toBeTruthy()
  })

  it('loads more history pages and wires pull-to-refresh on the list', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/wallet/transactions`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')

        if (cursor === '2') {
          return HttpResponse.json({
            items: [
              {
                amount: {
                  amountMinor: 45,
                  currency: 'EUR',
                },
                creditDetails: {
                  locationName: 'Lidl - Benfica',
                  packageCount: 9,
                },
                id: '33333333-3333-4333-8333-333333333333',
                occurredAt: '2026-03-14T10:05:00Z',
                status: 'completed',
                type: 'credit',
              },
              {
                amount: {
                  amountMinor: -200,
                  currency: 'EUR',
                },
                id: '44444444-4444-4444-8444-444444444444',
                occurredAt: '2026-03-13T17:54:00Z',
                status: 'completed',
                transferDetails: {
                  expectedArrivalAt: '2026-03-13T18:15:00Z',
                  payoutAccount: {
                    ibanMasked: 'PT50************90123',
                    spinEnabled: true,
                  },
                  requestedAt: '2026-03-13T17:54:00Z',
                },
                type: 'transfer_debit',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              nextCursor: null,
            },
          })
        }

        return HttpResponse.json({
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
              id: '11111111-1111-4111-8111-111111111111',
              occurredAt: '2026-03-14T14:30:00Z',
              status: 'completed',
              type: 'credit',
            },
            {
              amount: {
                amountMinor: -120,
                currency: 'EUR',
              },
              id: '22222222-2222-4222-8222-222222222222',
              occurredAt: '2026-03-14T13:10:00Z',
              status: 'processing',
              transferDetails: {
                expectedArrivalAt: '2026-03-15T13:10:00Z',
                payoutAccount: {
                  ibanMasked: 'PT50************90123',
                  spinEnabled: true,
                },
                requestedAt: '2026-03-14T13:10:00Z',
              },
              type: 'transfer_debit',
            },
          ],
          pageInfo: {
            hasNextPage: true,
            nextCursor: '2',
          },
        })
      }),
    )

    renderWithProvider(<WalletMovementsScreen />)

    await resolveMockApi()

    expect(screen.queryByText('Lidl - Benfica')).toBeNull()

    await act(async () => {
      screen.getByTestId('wallet-movements-list').props.onEndReached()
      await Promise.resolve()
    })

    await resolveMockApi(2)

    expect(screen.getByText('Lidl - Benfica')).toBeTruthy()

    await act(async () => {
      screen.getByTestId('wallet-movements-list').props.onRefresh()
      await Promise.resolve()
    })

    expect(
      typeof screen.getByTestId('wallet-movements-list').props.onRefresh,
    ).toBe('function')
    expect(
      screen.getByTestId('wallet-movements-list').props.refreshControl,
    ).toBeTruthy()

    await resolveMockApi(2)
  })

  it('renders an empty state when the wallet history has no movements', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/wallet/transactions`, () =>
        HttpResponse.json({
          items: [],
          pageInfo: {
            hasNextPage: false,
            nextCursor: null,
          },
        }),
      ),
    )

    renderWithProvider(<WalletMovementsScreen />)

    await resolveMockApi()

    expect(screen.getByText('Ainda não tens movimentos')).toBeTruthy()
    expect(
      screen.getByText(
        'Quando tiveres novos créditos ou transferências, eles vão aparecer aqui.',
      ),
    ).toBeTruthy()
  })

  it('renders a credit detail without transfer-only actions', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      movementId: '11111111-1111-4111-8111-111111111111',
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    await resolveMockApi()

    expect(screen.getByTestId('wallet-movement-detail-screen')).toBeTruthy()
    expect(screen.getByText('Crédito adicionado')).toBeTruthy()
    expect(
      screen.getByTestId('wallet-movement-detail-receipt-card'),
    ).toBeTruthy()
    expect(screen.queryByText('Partilhar comprovativo')).toBeNull()
  })

  it('renders a processing transfer detail with account timeline', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      movementId: '22222222-2222-4222-8222-222222222222',
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    await resolveMockApi()

    expect(screen.getByTestId('wallet-movement-detail-screen')).toBeTruthy()
    expect(screen.getByText('Transferência em processamento')).toBeTruthy()
    expect(
      screen.getByTestId('wallet-movement-detail-receipt-card'),
    ).toBeTruthy()
    expect(screen.getByText('Estado da transferência')).toBeTruthy()
    expect(
      screen.getByText('Disponível na conta até 24h, dependendo do banco.'),
    ).toBeTruthy()
  })

  it('renders a completed transfer detail with receipt sharing feedback', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      movementId: '44444444-4444-4444-8444-444444444444',
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    await resolveMockApi()

    expect(screen.getByText('Transferência concluída')).toBeTruthy()
    expect(
      screen.getByTestId('wallet-movement-detail-receipt-card'),
    ).toBeTruthy()
    fireEvent.press(screen.getByText('Partilhar comprovativo'))

    expect(mockShowToast).toHaveBeenCalledWith(
      'Partilhar comprovativo',
      expect.objectContaining({
        duration: 4500,
        message: 'Esta ação está a usar dados simulados por agora.',
        variant: 'mock',
      }),
    )
  })

  it('renders a failed transfer detail with a recovery action', async () => {
    mockApiServer.use(
      http.get(
        `${MOCK_API_ORIGIN}/wallet/transactions/failed-transfer`,
        async () => {
          const profile = await getMockProfileState()

          return HttpResponse.json({
            transaction: {
              amount: {
                amountMinor: -120,
                currency: 'EUR',
              },
              id: 'failed-transfer',
              occurredAt: '2026-03-14T13:10:00Z',
              status: 'failed',
              transferDetails: {
                payoutAccount: profile.payoutAccount,
                requestedAt: '2026-03-14T13:10:00Z',
              },
              type: 'transfer_debit',
            },
          })
        },
      ),
    )
    mockUseLocalSearchParams.mockReturnValue({
      movementId: 'failed-transfer',
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    await resolveMockApi()

    expect(screen.getAllByText('Transferência falhada').length).toBe(2)
    fireEvent.press(screen.getByText('Pedir nova transferência'))

    expect(mockRouterPush).toHaveBeenCalledWith('/wallet/transfer')
  })

  it('renders a cancelled transfer detail with cancelled state copy', async () => {
    mockApiServer.use(
      http.get(
        `${MOCK_API_ORIGIN}/wallet/transactions/cancelled-transfer`,
        async () => {
          const profile = await getMockProfileState()

          return HttpResponse.json({
            transaction: {
              amount: {
                amountMinor: -120,
                currency: 'EUR',
              },
              id: 'cancelled-transfer',
              occurredAt: '2026-03-14T13:10:00Z',
              status: 'cancelled',
              transferDetails: {
                payoutAccount: profile.payoutAccount,
                requestedAt: '2026-03-14T13:10:00Z',
              },
              type: 'transfer_debit',
            },
          })
        },
      ),
    )
    mockUseLocalSearchParams.mockReturnValue({
      movementId: 'cancelled-transfer',
    })

    renderWithProvider(<WalletMovementDetailScreen />)

    await resolveMockApi()

    expect(screen.getAllByText('Transferência cancelada').length).toBe(2)
    expect(screen.getAllByText('Cancelada em').length).toBeGreaterThan(0)
  })
})
