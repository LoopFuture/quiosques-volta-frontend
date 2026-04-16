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

describe('map screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
