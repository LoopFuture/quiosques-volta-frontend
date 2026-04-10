import { act, fireEvent, screen } from '@testing-library/react-native'
import { BackHandler } from 'react-native'
import HomeScreen from '@/features/home/screens/HomeScreen'
import { homeResponseSchema } from '@/features/home/models'
import { profileRoutes } from '@/features/profile/routes'
import { walletRoutes } from '@/features/wallet/routes'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { restorePlatformOS, setPlatformOS } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

const mockShowToast = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '@tests/support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

jest.mock('@/features/home/hooks', () => ({
  useHomeScreenQuery: jest.fn(),
}))

const { __mockRouterPush: mockRouterPush, __mockUsePathname: mockUsePathname } =
  jest.requireMock('expo-router')
const { useHomeScreenQuery: mockUseHomeScreenQuery } = jest.requireMock(
  '@/features/home/hooks',
)

const homeScreenState = homeResponseSchema.parse({
  greeting: {
    displayName: 'Joao Ferreira',
    memberSince: '2024-04-01',
  },
  recentActivity: [
    {
      amount: {
        amountMinor: 30,
        currency: 'EUR',
      },
      id: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-04-08T10:00:00.000Z',
      status: 'completed',
      subtitle: '6 embalagens',
      title: 'Pingo Doce - Afragide',
      type: 'credit',
    },
    {
      amount: {
        amountMinor: -470,
        currency: 'EUR',
      },
      id: '22222222-2222-4222-8222-222222222222',
      occurredAt: '2026-04-08T11:15:00.000Z',
      status: 'processing',
      subtitle: 'PT50************4321',
      title: 'Transferência',
      type: 'transfer_debit',
    },
  ],
  stats: {
    completedTransfersCount: 5,
    creditsEarned: {
      amountMinor: 1250,
      currency: 'EUR',
    },
    processingTransfersCount: 1,
    returnedPackagesCount: 30,
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
  unreadNotificationsCount: 2,
  walletBalance: {
    amountMinor: 470,
    currency: 'EUR',
  },
})

const homeScreenStateWithoutRecentActivity = homeResponseSchema.parse({
  ...homeScreenState,
  recentActivity: [],
})

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
    restorePlatformOS()
    mockUsePathname.mockReturnValue('/')
    mockUseHomeScreenQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
      isRefetching: false,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    restorePlatformOS()
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('renders the loading skeleton while the query is pending', () => {
    renderWithProvider(<HomeScreen />)

    expect(screen.getByTestId('home-dashboard-screen-skeleton')).toBeTruthy()
  })

  it('renders the error state and retries the query', () => {
    const refetch = jest.fn()

    mockUseHomeScreenQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isRefetching: false,
      refetch,
    })

    renderWithProvider(<HomeScreen />)

    expect(screen.getByTestId('home-dashboard-screen-error-state')).toBeTruthy()

    fireEvent.press(screen.getByText(i18n.t('routes.queryError.retryLabel')))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('renders the dashboard and routes the primary actions', () => {
    mockUseHomeScreenQuery.mockReturnValue({
      data: homeScreenState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<HomeScreen />)

    expect(screen.getByTestId('home-dashboard-screen')).toBeTruthy()
    expect(screen.getByText(homeScreenState.greeting.displayName)).toBeTruthy()
    expect(screen.getByText('Pingo Doce - Afragide')).toBeTruthy()
    expect(screen.getByText('Transferência')).toBeTruthy()

    fireEvent.press(
      screen.getByText(i18n.t('tabScreens.home.balanceCard.actionLabel')),
    )
    fireEvent.press(
      screen.getByText(i18n.t('tabScreens.home.overview.accountActionLabel')),
    )
    fireEvent.press(screen.getByLabelText('Pingo Doce - Afragide'))
    fireEvent.press(screen.getByLabelText('Transferência'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, walletRoutes.transfer)
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, profileRoutes.summary)
    expect(mockRouterPush).toHaveBeenNthCalledWith(
      3,
      walletRoutes.movementDetail(homeScreenState.recentActivity[0]!.id),
    )
    expect(mockRouterPush).toHaveBeenNthCalledWith(
      4,
      walletRoutes.movementDetail(homeScreenState.recentActivity[1]!.id),
    )
  })

  it('renders an empty state when there is no recent activity', () => {
    mockUseHomeScreenQuery.mockReturnValue({
      data: homeScreenStateWithoutRecentActivity,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    renderWithProvider(<HomeScreen />)

    expect(screen.getByTestId('home-recent-activity-empty-state')).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.home.recentActivity.emptyStateLabel'),
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.home.recentActivity.emptyStateTitle'),
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('tabScreens.home.recentActivity.emptyStateDescription'),
      ),
    ).toBeTruthy()
  })

  it('requires two Android back presses to exit from the home route', () => {
    const refetch = jest.fn()
    const removeBackHandlerListener = jest.fn()
    let hardwareBackPressListener:
      | (() => boolean | null | undefined)
      | undefined

    setPlatformOS('android')
    mockUseHomeScreenQuery.mockReturnValue({
      data: homeScreenState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch,
    })

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

    const view = renderWithProvider(<HomeScreen />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function),
    )
    expect(hardwareBackPressListener?.()).toBe(true)
    expect(mockShowToast).toHaveBeenCalledWith(
      i18n.t('tabScreens.home.exitHint'),
      expect.objectContaining({
        duration: 2500,
        variant: 'hint',
      }),
    )

    expect(hardwareBackPressListener?.()).toBe(true)
    expect(exitAppSpy).toHaveBeenCalledTimes(1)

    view.unmount()

    expect(removeBackHandlerListener).toHaveBeenCalled()
  })

  it('does not intercept the Android back button outside the home route', () => {
    let hardwareBackPressListener:
      | (() => boolean | null | undefined)
      | undefined

    setPlatformOS('android')
    mockUsePathname.mockReturnValue('/wallet')
    mockUseHomeScreenQuery.mockReturnValue({
      data: homeScreenState,
      isError: false,
      isPending: false,
      isRefetching: false,
      refetch: jest.fn(),
    })

    jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((eventName, listener) => {
        if (eventName === 'hardwareBackPress') {
          hardwareBackPressListener = listener
        }

        return {
          remove: jest.fn(),
        }
      })

    renderWithProvider(<HomeScreen />)

    expect(hardwareBackPressListener?.()).toBe(false)
    expect(mockShowToast).not.toHaveBeenCalled()
  })
})
