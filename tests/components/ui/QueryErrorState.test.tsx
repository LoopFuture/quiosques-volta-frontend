import { fireEvent, screen } from '@testing-library/react-native'
import { QueryErrorState } from '@/components/ui/QueryErrorState'
import { renderWithProvider } from '@tests/support/test-utils'

describe('QueryErrorState', () => {
  it('renders the shared copy and retries on press', () => {
    const onRetry = jest.fn()

    renderWithProvider(<QueryErrorState onRetry={onRetry} />)

    expect(screen.getByText('Falha ao carregar')).toBeTruthy()
    expect(
      screen.getByText('Não foi possível carregar isto agora.'),
    ).toBeTruthy()
    expect(
      screen.getByText(
        'Verifica a ligação e tenta novamente dentro de instantes.',
      ),
    ).toBeTruthy()

    fireEvent.press(screen.getByText('Tentar novamente'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
