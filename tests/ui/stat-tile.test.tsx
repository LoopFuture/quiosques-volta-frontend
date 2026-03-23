import { StatTile } from '@/components/ui/StatTile'
import { renderWithProvider } from '../support/test-utils'

describe('StatTile', () => {
  it('renders label, value, and helper', () => {
    const view = renderWithProvider(
      <StatTile
        helper="Pagamentos concluidos"
        label="Pagos"
        tone="success"
        value="23"
      />,
    )

    expect(view.getByText('Pagos')).toBeTruthy()
    expect(view.getByText('23')).toBeTruthy()
    expect(view.getByText('Pagamentos concluidos')).toBeTruthy()
  })
})
