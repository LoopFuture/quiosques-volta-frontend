import { Text } from 'react-native'
import { fireEvent, within } from '@testing-library/react-native'
import { TopBar } from '@/components/ui/TopBar'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('expo-network', () => ({
  __resetExpoNetworkMock: jest.fn(),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  getNetworkStateAsync: jest.fn(),
}))

const { __mockUseGlobalSearchParams: mockUseGlobalSearchParams } =
  jest.requireMock('expo-router')
const { getNetworkStateAsync } = jest.requireMock('expo-network') as {
  getNetworkStateAsync: jest.Mock
}
const { __setExpoConfig } = jest.requireMock('expo-constants') as {
  __setExpoConfig: jest.Mock
}

describe('TopBar', () => {
  beforeEach(() => {
    getNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    })
    mockUseGlobalSearchParams.mockReturnValue({})
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

  it('renders long home titles in the default layout', () => {
    const view = renderWithProvider(
      <TopBar
        variant="home"
        title="Nome muito comprido que nao deve partir em duas linhas no topo"
      />,
    )

    const title = view.getByText(
      'Nome muito comprido que nao deve partir em duas linhas no topo',
    )

    expect(title).toBeTruthy()
  })

  it('lets the home title wrap when larger text is enabled', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })
    const view = renderWithProvider(
      <TopBar
        variant="home"
        title="Nome muito comprido que deve poder partir em duas linhas com texto maior"
      />,
    )

    const title = view.getByText(
      'Nome muito comprido que deve poder partir em duas linhas com texto maior',
    )

    expect(title.props.numberOfLines).toBe(2)

    windowSpy.mockRestore()
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

  it('renders the offline indicator from the e2e route override', () => {
    __setExpoConfig({
      extra: {
        api: {
          baseUrl: 'https://volta.be.dev.theloop.tech',
        },
        e2e: {
          enabled: true,
        },
        eas: {
          projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
        },
        keycloak: {
          clientId: 'volta-mobile',
          issuerUrl: 'https://keycloak.example.com/realms/volta',
          scopes: ['openid', 'profile', 'email'],
        },
        sentry: {},
        webApp: {
          baseUrl: 'https://volta.example.com',
        },
      },
    })
    mockUseGlobalSearchParams.mockReturnValue({
      __e2eOffline: '1',
    })

    const view = renderWithProvider(<TopBar variant="title" title="Perfil" />)

    expect(view.getByTestId('top-bar-offline-indicator')).toBeTruthy()
  })

  it('keeps the compact title layout usable without actions', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(<TopBar variant="title" title="Perfil" />)

    expect(view.getByText('Perfil')).toBeTruthy()
    expect(view.queryByTestId('top-bar-action-badge')).toBeNull()

    windowSpy.mockRestore()
  })

  it('lets title-variant headers wrap when larger text is enabled', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })
    const view = renderWithProvider(
      <TopBar
        variant="title"
        title="Titulo bastante comprido para testar quebra com texto ampliado"
      />,
    )

    const title = view.getByText(
      'Titulo bastante comprido para testar quebra com texto ampliado',
    )

    expect(title.props.numberOfLines).toBe(2)

    windowSpy.mockRestore()
  })
})
