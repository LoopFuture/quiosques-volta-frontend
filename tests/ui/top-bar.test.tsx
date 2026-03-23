import { Text } from 'react-native'
import { fireEvent, within } from '@testing-library/react-native'
import { TopBar } from '@/components/ui/TopBar'
import { renderWithProvider } from '../support/test-utils'

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
    const view = renderWithProvider(
      <TopBar
        variant="title"
        title="Perfil"
        subtitle="Gestao de conta"
        leftAction={{ icon: <Text>Back</Text>, label: 'Voltar' }}
        rightAction={{ icon: <Text>More</Text>, label: 'Mais' }}
      />,
    )

    expect(view.getByText('Perfil')).toBeTruthy()
    expect(view.getByText('Gestao de conta')).toBeTruthy()
    expect(view.getByText('Back')).toBeTruthy()
    expect(view.getByText('More')).toBeTruthy()
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
})
