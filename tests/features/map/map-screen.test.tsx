import { fireEvent, screen } from '@testing-library/react-native'
import MapScreen from '@/app/(tabs)/map'
import { barcodeRoutes } from '@/features/barcode/routes'
import { renderWithProvider } from '../../support/test-utils'

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

const { __mockRouterPush: mockRouterPush } = jest.requireMock('expo-router')

describe('map screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the map fallback without the preview card', async () => {
    renderWithProvider(<MapScreen />)

    expect(screen.getByTestId('map-screen')).toBeTruthy()
    expect(screen.getByText('Mapa Volta')).toBeTruthy()
    expect(await screen.findByTestId('map-coming-soon-card')).toBeTruthy()
    expect(screen.getByText('Mapa em breve')).toBeTruthy()
    expect(
      screen.getByText('Usa já o teu código. O mapa vem a seguir.'),
    ).toBeTruthy()
    expect(screen.getByText('Mostrar código')).toBeTruthy()
    expect(screen.queryByTestId('map-preview-card')).toBeNull()

    fireEvent.press(screen.getByText('Mostrar código'))

    expect(mockRouterPush).toHaveBeenCalledWith(barcodeRoutes.index)
  })
})
