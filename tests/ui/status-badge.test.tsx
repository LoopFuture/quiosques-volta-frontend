import { StatusBadge } from '@/components/ui/StatusBadge'
import { renderWithProvider } from '../support/test-utils'

describe('StatusBadge', () => {
  it('renders the badge label', () => {
    const view = renderWithProvider(
      <StatusBadge tone="success">Pago</StatusBadge>,
    )

    expect(view.getByText('Pago')).toBeTruthy()
  })
})
