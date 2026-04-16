import { fireEvent, screen } from '@testing-library/react-native'
import { MapScreenState } from '@/features/map/components/MapEmptyState'
import { renderWithProvider } from '@tests/support/test-utils'

describe('map empty state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const buildProps = (overrides = {}) => ({
    actionHint: 'O que vais encontrar aqui',
    description:
      'Em breve vais poder ver aqui o mapa Volta e os pontos disponíveis antes de saíres para a próxima devolução. Até lá, usa já o teu código para chegares à máquina pronto a identificar-te.',
    errorDescription:
      'Não foi possível preparar a lista de pontos Volta agora.',
    errorRecoveryHint:
      'Tenta novamente para veres os locais previstos antes da próxima devolução.',
    errorTitle: 'Mapa indisponível',
    fallbackActionLabel: 'Mostrar código',
    fallbackActionTitle: 'Identificação pronta para a próxima devolução',
    fallbackDescription:
      'Identifica-te logo na máquina com o teu código Volta e evita parar quando chegares ao ponto de devolução.',
    fallbackStatusLabel: 'Código pronto',
    onActionPress: jest.fn(),
    onRetry: jest.fn(),
    statusLabel: 'Mapa em breve',
    title: 'O mapa e os pontos Volta vão aparecer aqui',
    ...overrides,
  })

  it('renders the coming soon state and triggers the barcode action', () => {
    const onActionPress = jest.fn()

    renderWithProvider(<MapScreenState {...buildProps({ onActionPress })} />)

    expect(screen.getByTestId('map-empty-state')).toBeTruthy()
    expect(screen.getByTestId('map-coming-soon-card')).toBeTruthy()

    fireEvent.press(screen.getByRole('button', { name: 'Mostrar código' }))

    expect(onActionPress).toHaveBeenCalledTimes(1)
  })

  it('renders the error state and retries', () => {
    const onRetry = jest.fn()

    renderWithProvider(
      <MapScreenState {...buildProps({ onRetry, state: 'error' })} />,
    )

    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders the loading skeleton state', () => {
    renderWithProvider(<MapScreenState {...buildProps({ state: 'loading' })} />)

    expect(screen.getByTestId('map-screen-skeleton')).toBeTruthy()
  })
})
