import { act, fireEvent, screen, within } from '@testing-library/react-native'
import { BackHandler } from 'react-native'
import { requestMockWalletTransfer } from '@/features/app-data/mock'
import HomeScreen from '@/app/(tabs)/index'
import {
  refreshScrollScreen,
  renderWithProvider,
  resolveMockApi,
} from '../../support/test-utils'
import { restorePlatformOS, setPlatformOS } from '../../support/react-native'

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

const { __mockRouterPush: mockRouterPush, __mockUsePathname: mockUsePathname } =
  jest.requireMock('expo-router')

describe('home dashboard screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    restorePlatformOS()
  })

  it('renders the home dashboard from backend-shaped data', async () => {
    const view = renderWithProvider(<HomeScreen />)

    expect(view.getByTestId('home-dashboard-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(view.getByTestId('home-dashboard-screen')).toBeTruthy()
    expect(view.getByTestId('top-bar-home-logo')).toBeTruthy()
    expect(
      within(view.getByTestId('top-bar-action-badge')).getByText('2'),
    ).toBeTruthy()
    expect(view.getByText('Bem-vindo')).toBeTruthy()
    expect(view.getByText('Saldo disponível')).toBeTruthy()
    expect(
      view.queryByText('Começa a próxima devolução sem perder tempo'),
    ).toBeNull()
    expect(view.getByText('Neste momento')).toBeTruthy()
    expect(view.getByText('Atividade recente')).toBeTruthy()
    expect(view.getByText('Pingo Doce - Afragide')).toBeTruthy()
    expect(view.getAllByText('Transfer').length).toBeGreaterThan(0)
  })

  it('routes summary, transfer, recent activity, and notifications', async () => {
    renderWithProvider(<HomeScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByText('Ver conta'))
    fireEvent.press(screen.getByText('Transferir'))
    fireEvent.press(screen.getByLabelText('Pingo Doce - Afragide'))
    fireEvent.press(screen.getByLabelText('Transfer'))
    fireEvent.press(screen.getByLabelText('Notificações'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, '/profile/summary')
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, '/wallet/transfer')
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, {
      params: {
        movementId: '11111111-1111-4111-8111-111111111111',
      },
      pathname: '/wallet/[movementId]',
    })
    expect(mockRouterPush).toHaveBeenNthCalledWith(4, {
      params: {
        movementId: '22222222-2222-4222-8222-222222222222',
      },
      pathname: '/wallet/[movementId]',
    })
    expect(mockRouterPush).toHaveBeenNthCalledWith(5, '/notifications')
  })

  it('refetches the dashboard on pull to refresh', async () => {
    renderWithProvider(<HomeScreen />)

    await resolveMockApi()
    const requestTransfer = requestMockWalletTransfer({
      amount: {
        amountMinor: 100,
        currency: 'EUR',
      },
      payoutRail: 'spin',
    })

    await resolveMockApi()
    await requestTransfer
    await refreshScrollScreen('home-dashboard-screen')

    expect(screen.getByText(/3,70/)).toBeTruthy()
  })

  it('requires two Android back presses to close the app from home', async () => {
    setPlatformOS('android')

    const removeBackHandlerListener = jest.fn()
    let hardwareBackPressListener:
      | (() => boolean | null | undefined)
      | undefined
    const addEventListenerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((eventName, listener) => {
        if (eventName === 'hardwareBackPress') {
          hardwareBackPressListener = listener
        }

        return {
          remove: removeBackHandlerListener,
        }
      })
    const exitAppSpy = jest
      .spyOn(BackHandler, 'exitApp')
      .mockImplementation(() => {})

    renderWithProvider(<HomeScreen />)

    await resolveMockApi()

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    )
    expect(hardwareBackPressListener?.()).toBe(true)
    expect(mockShowToast).toHaveBeenCalledWith(
      'Toca novamente em voltar para fechar a app.',
      expect.objectContaining({
        duration: 2500,
        variant: 'hint',
      }),
    )

    expect(hardwareBackPressListener?.()).toBe(true)
    expect(exitAppSpy).toHaveBeenCalledTimes(1)
  })
})
