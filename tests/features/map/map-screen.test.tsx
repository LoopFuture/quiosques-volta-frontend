import { screen } from '@testing-library/react-native'
import MapScreen from '@/app/(tabs)/map'
import * as mapApi from '@/features/map/api'
import { renderWithProvider } from '../../support/test-utils'

describe('map screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the map fallback without the preview card and fetches map data', async () => {
    const fetchMapScreenSnapshotSpy = jest.spyOn(
      mapApi,
      'fetchMapScreenSnapshot',
    )

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
    expect(fetchMapScreenSnapshotSpy).toHaveBeenCalled()
  })
})
