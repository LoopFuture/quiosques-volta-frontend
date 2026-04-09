import { Text } from 'react-native'
import { fireEvent, within } from '@testing-library/react-native'
import { TopBar } from '@/components/ui/TopBar'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'

jest.mock('expo-network', () => ({
  __resetExpoNetworkMock: jest.fn(),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(),
}))

const { getNetworkStateAsync } = jest.requireMock('expo-network') as {
  getNetworkStateAsync: jest.Mock
}

describe('TopBar', () => {
  beforeEach(() => {
    getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    })
  })

  it('renders the home variant and triggers actions', () => {
    const onNotificationsPress = jest.fn()
    const view = renderWithProvider(
      <TopBar
        variant="home"
        eyebrow="Bem-vindo"
        title="Volta"
        rightAction={{
          badgeValue: '3',
          hint: '3 notificacoes por ler',
          icon: <Text>Bell</Text>,
          label: 'Notificacoes',
          onPress: onNotificationsPress,
        }}
      />,
    )

    expect(view.getByText('Bem-vindo')).toBeTruthy()
    expect(view.getByText('Volta')).toBeTruthy()
    expect(view.getByTestId('top-bar-home-logo')).toBeTruthy()
    expect(view.queryByTestId('top-bar-offline-indicator')).toBeNull()
    expect(view.queryByText('SDR')).toBeNull()
    expect(view.getByText('Bell')).toBeTruthy()
    expect(
      within(view.getByTestId('top-bar-action-badge')).getByText('3'),
    ).toBeTruthy()

    fireEvent.press(view.getByLabelText('Notificacoes'))

    expect(onNotificationsPress).toHaveBeenCalledTimes(1)
  })

  it('renders the centered title variant with optional actions', () => {
    const onBackPress = jest.fn()
    const onMorePress = jest.fn()
    const view = renderWithProvider(
      <TopBar
        variant="title"
        eyebrow="Conta"
        title="Perfil"
        subtitle="Gestao de conta"
        leftAction={{
          icon: <Text>Back</Text>,
          label: 'Voltar',
          onPress: onBackPress,
        }}
        rightAction={{
          icon: <Text>More</Text>,
          label: 'Mais',
          onPress: onMorePress,
        }}
      />,
    )

    expect(view.getByText('Conta')).toBeTruthy()
    expect(view.getByText('Perfil')).toBeTruthy()
    expect(view.getByText('Gestao de conta')).toBeTruthy()
    expect(view.getByText('Back')).toBeTruthy()
    expect(view.getByText('More')).toBeTruthy()

    fireEvent.press(view.getByLabelText('Voltar'))
    fireEvent.press(view.getByLabelText('Mais'))

    expect(onBackPress).toHaveBeenCalledTimes(1)
    expect(onMorePress).toHaveBeenCalledTimes(1)
  })

  it('keeps long badge values on the notifications action', () => {
    const view = renderWithProvider(
      <TopBar
        variant="home"
        title="Volta"
        rightAction={{
          badgeValue: '99+',
          icon: <Text>Bell</Text>,
          label: 'Notificacoes',
        }}
      />,
    )

    expect(
      within(view.getByTestId('top-bar-action-badge')).getByText('99+'),
    ).toBeTruthy()
  })

  it('renders an offline warning when connectivity is unavailable', async () => {
    getNetworkStateAsync.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    })

    const view = renderWithProvider(<TopBar variant="title" title="Perfil" />)

    expect(await view.findByTestId('top-bar-offline-indicator')).toBeTruthy()
    expect(view.getByText('Sem ligação')).toBeTruthy()
  })

  it('keeps the compact home layout usable without eyebrow, subtitle, or actions', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(<TopBar variant="home" title="Volta" />)

    expect(view.getByTestId('top-bar-home-logo')).toBeTruthy()
    expect(view.queryByText('Bem-vindo')).toBeNull()
    expect(view.queryByLabelText('Notificacoes')).toBeNull()
    expect(view.queryByTestId('top-bar-action-badge')).toBeNull()

    windowSpy.mockRestore()
  })

  it('renders the compact home variant in dark mode with subtitle', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithTheme(
      <TopBar variant="home" subtitle="Saldo atualizado" title="Volta" />,
      { defaultTheme: 'dark' },
    )

    expect(view.getByText('Saldo atualizado')).toBeTruthy()
    expect(view.getByTestId('top-bar-home-logo')).toBeTruthy()

    windowSpy.mockRestore()
  })

  it('renders the offline indicator in the home variant', async () => {
    getNetworkStateAsync.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    })

    const view = renderWithProvider(<TopBar variant="home" title="Volta" />)

    expect(await view.findByTestId('top-bar-offline-indicator')).toBeTruthy()
  })

  it('keeps the compact title layout usable without actions', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(<TopBar variant="title" title="Perfil" />)

    expect(view.getByText('Perfil')).toBeTruthy()
    expect(view.queryByTestId('top-bar-action-badge')).toBeNull()

    windowSpy.mockRestore()
  })
})
