import { StatusBadge } from '@/components/ui/StatusBadge'
import { renderWithProvider } from '@tests/support/test-utils'

describe('StatusBadge', () => {
  it('renders the badge label', () => {
    const view = renderWithProvider(
      <StatusBadge tone="success">Pago</StatusBadge>,
    )

    expect(view.getByText('Pago')).toBeTruthy()
  })

  it('defaults to the neutral tone when no tone is provided', () => {
    const view = renderWithProvider(<StatusBadge>Pendente</StatusBadge>)

    expect(view.getByText('Pendente')).toBeTruthy()
  })
})
