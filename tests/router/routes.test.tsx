import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import HomeScreen from '@/app/(tabs)/index'
import MapScreen from '@/app/(tabs)/map'
import ProfileScreen from '@/app/(tabs)/profile'
import WalletScreen from '@/app/(tabs)/wallet'
import NotFoundScreen from '@/app/+not-found'
import NotificationsScreen from '@/app/notifications'
import ProfileAppSettingsScreen from '@/app/profile/app-settings'
import ProfileHelpScreen from '@/app/profile/help'
import ProfilePaymentsScreen from '@/app/profile/payments'
import ProfilePersonalScreen from '@/app/profile/personal'
import ProfilePrivacyScreen from '@/app/profile/privacy'
import ProfileSummaryScreen from '@/app/profile/summary'
import ProfileSetupScreen from '@/app/setup'
import WalletMovementDetailScreen from '@/app/wallet/[movementId]'
import WalletMovementsScreen from '@/app/wallet/movements'
import WalletTransferScreen from '@/app/wallet/transfer'
import { renderWithProvider, resolveMockApi } from '../support/test-utils'

const mockShowToast = jest.fn()
const mockBrightnessGetBrightnessAsync = jest.fn()
const mockBrightnessIsAvailableAsync = jest.fn()
const mockBrightnessIsUsingSystemBrightnessAsync = jest.fn()
const mockBrightnessRestoreSystemBrightnessAsync = jest.fn()
const mockBrightnessSetBrightnessAsync = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '../support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

jest.mock('expo-brightness', () => ({
  getBrightnessAsync: mockBrightnessGetBrightnessAsync,
  isAvailableAsync: mockBrightnessIsAvailableAsync,
  isUsingSystemBrightnessAsync: mockBrightnessIsUsingSystemBrightnessAsync,
  restoreSystemBrightnessAsync: mockBrightnessRestoreSystemBrightnessAsync,
  setBrightnessAsync: mockBrightnessSetBrightnessAsync,
}))

jest.mock('react-native-qrcode-svg', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')

  return function MockQRCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

const BarcodeScreen = jest.requireActual('@/app/(tabs)/barcode').default

const {
  __mockRouterPush: mockRouterPush,
  __mockRouterCanGoBack: mockRouterCanGoBack,
  __mockRouterReplace: mockRouterReplace,
  __mockRouterBack: mockRouterBack,
  __mockStackScreen: mockStackScreen,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
} = jest.requireMock('expo-router')

function getButtonDisabledState(testID: string) {
  const button = screen.getByTestId(testID)

  return button.props['aria-disabled'] ?? false
}

async function renderScreen(ui: ReactElement) {
  renderWithProvider(ui)

  await resolveMockApi()
}

describe('app screens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockRouterCanGoBack.mockReturnValue(false)
    mockUseLocalSearchParams.mockReturnValue({})
    mockBrightnessIsAvailableAsync.mockResolvedValue(true)
    mockBrightnessGetBrightnessAsync.mockResolvedValue(0.42)
    mockBrightnessIsUsingSystemBrightnessAsync.mockResolvedValue(false)
    mockBrightnessSetBrightnessAsync.mockResolvedValue(undefined)
    mockBrightnessRestoreSystemBrightnessAsync.mockResolvedValue(undefined)
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders the home dashboard content', async () => {
    await renderScreen(<HomeScreen />)

    expect(screen.getByTestId('home-dashboard-screen')).toBeTruthy()
    expect(screen.getByText('Bem-vindo')).toBeTruthy()
    expect(screen.getByText('Joao Ferreira')).toBeTruthy()
    expect(screen.queryByText('Volta')).toBeNull()
    expect(screen.queryByLabelText('Resumo')).toBeNull()
    expect(screen.queryByLabelText('Resumo de hoje')).toBeNull()
    expect(screen.getByText('Neste momento')).toBeTruthy()
    expect(screen.getByText('Ver conta')).toBeTruthy()
    expect(screen.getByText('Atividade recente')).toBeTruthy()
    expect(screen.queryByText('Auth building blocks')).toBeNull()
    expect(screen.queryByText('Payment state patterns')).toBeNull()
    expect(screen.queryByText('Conteudo inicial')).toBeNull()
  })

  it('routes home summary, transfer, and notifications', async () => {
    await renderScreen(<HomeScreen />)

    fireEvent.press(screen.getByText('Ver conta'))
    fireEvent.press(screen.getByText('Transferir'))
    fireEvent.press(screen.getByLabelText('Notificações'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, '/profile/summary')
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, '/wallet/transfer')
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, '/notifications')
  })

  it('renders the profile help route', async () => {
    await renderScreen(<ProfileHelpScreen />)

    expect(screen.getByTestId('onboarding-screen')).toBeTruthy()
    expect(screen.getByText('Devolve e recebe sem surpresas')).toBeTruthy()
  })

  it('renders the wallet tab content', async () => {
    await renderScreen(<WalletScreen />)

    expect(screen.getByTestId('wallet-screen')).toBeTruthy()
    expect(screen.getByText('Carteira')).toBeTruthy()
    expect(screen.getByText('Saldo disponível')).toBeTruthy()
    expect(screen.getByText('Histórico recente')).toBeTruthy()
    expect(screen.getByText('Ver histórico completo')).toBeTruthy()
  })

  it('renders the wallet transfer route', async () => {
    await renderScreen(<WalletTransferScreen />)

    expect(screen.getByTestId('wallet-transfer-screen')).toBeTruthy()
    expect(screen.getByText('Transferir saldo')).toBeTruthy()
    expect(screen.getByTestId('wallet-transfer-amount-input')).toBeTruthy()
    expect(screen.getByText('Confirmar transferência')).toBeTruthy()
    expect(getButtonDisabledState('wallet-transfer-submit-button')).toBe(true)
  })

  it('renders the wallet movements route', async () => {
    await renderScreen(<WalletMovementsScreen />)

    expect(screen.getByTestId('wallet-movements-screen')).toBeTruthy()
    expect(screen.getByText('Histórico completo')).toBeTruthy()
    expect(screen.getByText('Créditos')).toBeTruthy()
    expect(screen.getByText('Transferências')).toBeTruthy()
  })

  it('renders the notifications route', async () => {
    await renderScreen(<NotificationsScreen />)

    expect(screen.getByTestId('notifications-screen')).toBeTruthy()
    expect(screen.getByText('Notificações')).toBeTruthy()
    expect(screen.getByText('Marcar tudo como lido')).toBeTruthy()
    expect(screen.getByText('Limpar tudo')).toBeTruthy()
  })

  it('renders the wallet movement detail route and its actions', async () => {
    mockUseLocalSearchParams.mockReturnValue({
      movementId: '44444444-4444-4444-8444-444444444444',
    })

    await renderScreen(<WalletMovementDetailScreen />)

    expect(screen.getByTestId('wallet-movement-detail-screen')).toBeTruthy()
    expect(screen.getByText('Transferência concluída')).toBeTruthy()
    expect(screen.getByText('Partilhar comprovativo')).toBeTruthy()

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

  it('renders the map tab content', async () => {
    await renderScreen(<MapScreen />)

    expect(screen.getByTestId('map-screen')).toBeTruthy()
    expect(screen.getByTestId('map-screen-scroll-view')).toBeTruthy()
    expect(screen.getByText('Mapa Volta')).toBeTruthy()
    expect(await screen.findByTestId('map-coming-soon-card')).toBeTruthy()
    expect(screen.getByText('Mapa em breve')).toBeTruthy()
    expect(
      screen.getByText('Usa já o teu código. O mapa vem a seguir.'),
    ).toBeTruthy()
    expect(screen.queryByTestId('map-preview-card')).toBeNull()
  })

  it('renders the map fallback without search actions or preview locations', async () => {
    await renderScreen(<MapScreen />)

    expect(screen.queryByLabelText('Procurar máquinas Volta')).toBeNull()
    expect(screen.queryByTestId('map-preview-location')).toBeNull()
    expect(screen.queryByTestId('map-screen-skeleton')).toBeNull()
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  it('renders the barcode tab content', async () => {
    await renderScreen(<BarcodeScreen />)

    expect(screen.getByTestId('barcode-screen')).toBeTruthy()
    expect(screen.getByText('Código')).toBeTruthy()
    expect(screen.getByText('O teu código Volta')).toBeTruthy()
    expect(screen.getByText('Código ativo')).toBeTruthy()
    expect(screen.getByText('Mostrar em ecrã inteiro')).toBeTruthy()
    expect(screen.getByText('Válido por')).toBeTruthy()
    expect(screen.getByTestId('barcode-inline-countdown')).toBeTruthy()
    expect(screen.getByTestId('barcode-qr-trigger')).toBeTruthy()
    expect(screen.queryByText('VF-0001-RTM-2026')).toBeNull()
  })

  it('opens the barcode qr modal from the inline qr trigger', async () => {
    await renderScreen(<BarcodeScreen />)

    fireEvent.press(screen.getByTestId('barcode-qr-trigger'))

    await waitFor(() => {
      expect(screen.getByTestId('barcode-qr-modal')).toBeTruthy()
      expect(screen.getByText('Apresenta este código na máquina')).toBeTruthy()
      expect(mockBrightnessSetBrightnessAsync).toHaveBeenCalledWith(1)
    })
  })

  it('renders the profile tab content', async () => {
    await renderScreen(<ProfileScreen />)

    expect(screen.getByTestId('profile-screen')).toBeTruthy()
    expect(screen.getAllByText('Perfil').length).toBeGreaterThan(0)
    expect(screen.getByText('Rever conta')).toBeTruthy()
    expect(screen.getByText('Rever antes do reembolso')).toBeTruthy()
    expect(screen.getByLabelText('Pagamentos')).toBeTruthy()
    expect(screen.getByText('Privacidade e segurança')).toBeTruthy()
    expect(screen.getByText('Definições da app')).toBeTruthy()
    expect(screen.getByText('Terminar sessão')).toBeTruthy()
    fireEvent.press(screen.getByLabelText('Dados do perfil'))
    fireEvent.press(screen.getByLabelText('Privacidade e segurança'))
    fireEvent.press(screen.getByLabelText('Pagamentos'))
    fireEvent.press(screen.getByLabelText('Definições da app'))

    expect(mockRouterPush).toHaveBeenNthCalledWith(1, '/profile/personal')
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, '/profile/privacy')
    expect(mockRouterPush).toHaveBeenNthCalledWith(3, '/profile/payments')
    expect(mockRouterPush).toHaveBeenNthCalledWith(4, '/profile/app-settings')
  })

  it('routes onboarding help from the profile tab', async () => {
    await renderScreen(<ProfileScreen />)

    fireEvent.press(screen.getByLabelText('Como funciona a Volta'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profile/help')
  })

  it.each([
    [
      'profile summary',
      ProfileSummaryScreen,
      'profile-summary-screen',
      'A tua atividade',
    ],
    [
      'profile personal',
      ProfilePersonalScreen,
      'profile-personal-screen',
      'Dados do perfil',
    ],
    [
      'profile privacy',
      ProfilePrivacyScreen,
      'profile-privacy-screen',
      'Privacidade e segurança',
    ],
    [
      'profile payments',
      ProfilePaymentsScreen,
      'profile-payments-screen',
      'Pagamentos',
    ],
    [
      'profile app settings',
      ProfileAppSettingsScreen,
      'profile-app-settings-screen',
      'Definições da app',
    ],
    [
      'profile setup',
      ProfileSetupScreen,
      'profile-setup-screen',
      'Confirma o teu perfil',
    ],
  ])(
    'renders the %s route',
    async (_routeName, ScreenComponent, testId, title) => {
      await renderScreen(<ScreenComponent />)

      expect(screen.getByTestId(testId)).toBeTruthy()
      expect(screen.getAllByText(title).length).toBeGreaterThan(0)
    },
  )

  it('renders the not found fallback route', async () => {
    await renderScreen(<NotFoundScreen />)

    expect(screen.getByTestId('not-found-screen')).toBeTruthy()
    expect(screen.getByText('Este ecrã já não está disponível.')).toBeTruthy()
    expect(
      screen.getByText(
        'Volta ao início para continuar. Se abriste uma ligação antiga, este ecrã pode já não estar disponível.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Ir para o início')).toBeTruthy()
    expect(screen.queryByText('Voltar')).toBeNull()

    fireEvent.press(screen.getByText('Ir para o início'))

    expect(mockRouterReplace).toHaveBeenCalledWith('/')
    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { title: 'Ecrã indisponível' },
      }),
      undefined,
    )
  })

  it('shows a back action on the not found route when history exists', async () => {
    mockRouterCanGoBack.mockReturnValue(true)

    await renderScreen(<NotFoundScreen />)

    fireEvent.press(screen.getByText('Voltar'))

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })
})
