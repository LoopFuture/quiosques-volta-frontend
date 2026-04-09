import { fireEvent, screen } from '@testing-library/react-native'
import {
  MapEmptyState,
  MapScreenSkeleton,
} from '@/features/map/components/MapEmptyState'
import { renderWithProvider } from '@tests/support/test-utils'

describe('map empty state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the fallback card and triggers the barcode action', () => {
    const onActionPress = jest.fn()

    renderWithProvider(
      <MapEmptyState
        actionHint="Brevemente"
        description="O mapa chega depois do codigo."
        fallbackActionLabel="Mostrar codigo"
        fallbackActionTitle="Usa o teu codigo"
        fallbackDescription="Acede ja ao codigo pessoal enquanto o mapa fica pronto."
        onActionPress={onActionPress}
        statusLabel="Em breve"
        title="Mapa Volta"
      />,
    )

    expect(screen.getByTestId('map-coming-soon-card')).toBeTruthy()
    expect(screen.getByText('Mapa Volta')).toBeTruthy()

    fireEvent.press(screen.getByText('Mostrar codigo'))

    expect(onActionPress).toHaveBeenCalledTimes(1)
  })

  it('renders the loading skeleton state', () => {
    renderWithProvider(<MapScreenSkeleton />)

    expect(screen.getByTestId('map-screen-skeleton')).toBeTruthy()
  })
})
