import { fireEvent, screen } from '@testing-library/react-native'
import MapScreen from '@/app/(tabs)/map'
import { barcodeRoutes } from '@/features/barcode/routes'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '@tests/support/expo-router-mock',
  )

  return createExpoRouterMock()
})

const { __mockRouterPush: mockRouterPush } = jest.requireMock('expo-router')
const {
  __mockRouterReplace: mockRouterReplace,
  __mockUseLocalSearchParams: mockUseLocalSearchParams,
  __mockUsePathname: mockUsePathname,
} = jest.requireMock('expo-router')

describe('map screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({})
    mockUsePathname.mockReturnValue('/map')
  })

  it('renders the coming soon message and routes the code action to barcode', async () => {
    renderWithProvider(<MapScreen />)

    expect(screen.getByTestId('map-screen')).toBeTruthy()
    expect(screen.getByText('Mapa Volta')).toBeTruthy()
    expect(await screen.findByTestId('map-coming-soon-card')).toBeTruthy()
    expect(screen.getByText('Mapa em breve')).toBeTruthy()
    expect(
      screen.getByText('O mapa e os pontos Volta vão aparecer aqui'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Em breve vais poder ver aqui o mapa Volta e os pontos disponíveis antes de saíres para a próxima devolução. Até lá, usa já o teu código para chegares à máquina pronto a identificar-te.',
      ),
    ).toBeTruthy()
    expect(screen.getByTestId('map-screen-scroll-view')).toBeTruthy()
    expect(screen.queryByTestId('map-preview-card')).toBeNull()
    expect(screen.getByRole('button', { name: 'Mostrar código' })).toBeTruthy()

    fireEvent.press(screen.getByRole('button', { name: 'Mostrar código' }))

    expect(mockRouterPush).toHaveBeenCalledWith(barcodeRoutes.index)
  })

  it('renders the forced e2e error state and clears it on retry', () => {
    const { __setExpoConfig } = jest.requireMock('expo-constants') as {
      __setExpoConfig: jest.Mock
    }

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
    mockUseLocalSearchParams.mockReturnValue({
      __e2eQueryState: 'error',
    })

    renderWithProvider(<MapScreen />)

    expect(screen.getByTestId('map-error-state')).toBeTruthy()

    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(mockRouterReplace).toHaveBeenCalledWith('/map')
  })
})
