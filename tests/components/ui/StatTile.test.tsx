import { StatTile } from '@/components/ui/StatTile'
import { renderWithProvider } from '@tests/support/test-utils'

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

  it('defaults to the neutral tone when helper text is omitted', () => {
    const view = renderWithProvider(<StatTile label="Pendentes" value="4" />)

    expect(view.getByText('Pendentes')).toBeTruthy()
    expect(view.getByText('4')).toBeTruthy()
    expect(view.queryByText('Pagamentos concluidos')).toBeNull()
  })
})
