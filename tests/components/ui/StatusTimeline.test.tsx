import { StatusTimeline } from '@/components/ui/StatusTimeline'
import type { TimelineItem } from '@/components/ui/types'
import { renderWithProvider } from '@tests/support/test-utils'

describe('StatusTimeline', () => {
  it('renders each timeline state', () => {
    const items: TimelineItem[] = [
      { id: 'one', label: 'Identidade verificada', state: 'done' },
      {
        description: 'A enviar para SPIN.',
        id: 'two',
        label: 'Transferencia em curso',
        state: 'current',
      },
      { id: 'three', label: 'Registo no ledger', state: 'upcoming' },
    ]

    const view = renderWithProvider(<StatusTimeline items={items} />)

    expect(view.getByText('Identidade verificada')).toBeTruthy()
    expect(view.getByText('Transferencia em curso')).toBeTruthy()
    expect(view.getByText('A enviar para SPIN.')).toBeTruthy()
    expect(view.getByText('Registo no ledger')).toBeTruthy()
    expect(view.getAllByText('✓')).toHaveLength(1)
    expect(view.getByText('•')).toBeTruthy()
  })
})
