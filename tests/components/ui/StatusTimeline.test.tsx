import { StatusTimeline } from '@/components/ui/StatusTimeline'
import type { TimelineItem } from '@/components/ui/types'
import { renderWithProvider } from '@tests/support/test-utils'

describe('StatusTimeline', () => {
  it('renders each timeline state', () => {
    const items: TimelineItem[] = [
      {
        accessibilityStateLabel: 'Etapa concluída',
        id: 'one',
        label: 'Identidade verificada',
        state: 'done',
      },
      {
        accessibilityStateLabel: 'Etapa atual',
        description: 'A enviar para SPIN.',
        id: 'two',
        label: 'Transferencia em curso',
        state: 'current',
      },
      {
        accessibilityStateLabel: 'Próxima etapa',
        id: 'three',
        label: 'Registo no ledger',
        state: 'upcoming',
      },
    ]

    const view = renderWithProvider(<StatusTimeline items={items} />)

    expect(view.getByText('Identidade verificada')).toBeTruthy()
    expect(view.getByText('Transferencia em curso')).toBeTruthy()
    expect(view.getByText('A enviar para SPIN.')).toBeTruthy()
    expect(view.getByText('Registo no ledger')).toBeTruthy()
    expect(view.getAllByText('✓')).toHaveLength(1)
    expect(view.getByText('•')).toBeTruthy()
    expect(
      view.getByLabelText(
        'Transferencia em curso. Etapa atual. A enviar para SPIN.',
      ),
    ).toBeTruthy()
    expect(
      view.getByLabelText(
        'Transferencia em curso. Etapa atual. A enviar para SPIN.',
      ).props.accessibilityState,
    ).toEqual({ selected: true })
    expect(
      view.getByLabelText('Identidade verificada. Etapa concluída').props
        .accessibilityValue,
    ).toEqual({ text: '1 of 3. Etapa concluída' })
    expect(
      view.getByLabelText('Registo no ledger. Próxima etapa').props
        .accessibilityValue,
    ).toEqual({ text: '3 of 3. Próxima etapa' })
  })

  it('falls back to state text when accessibility state labels are omitted', () => {
    const items: TimelineItem[] = [
      {
        id: 'pending',
        label: 'Pedido recebido',
        state: 'upcoming',
      },
      {
        description: 'A validar documentos.',
        id: 'active',
        label: 'Validacao em curso',
        state: 'current',
      },
    ]

    const view = renderWithProvider(<StatusTimeline items={items} />)

    expect(view.getByLabelText('Pedido recebido. upcoming')).toBeTruthy()
    expect(
      view.getByLabelText('Validacao em curso. current. A validar documentos.'),
    ).toBeTruthy()
  })
})
