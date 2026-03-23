import { Text } from 'react-native'
import { DetailCard } from '@/components/ui/DetailCard'
import type { DetailItem } from '@/components/ui/types'
import { renderWithProvider } from '../support/test-utils'

describe('DetailCard', () => {
  it('renders detail rows and footer content', () => {
    const items: DetailItem[] = [
      { label: 'Montante', tone: 'accent', value: '4,70€' },
      { helper: 'Pagamento instantaneo', label: 'Canal', value: 'SPIN' },
    ]

    const view = renderWithProvider(
      <DetailCard
        footer={<Text>Aviso</Text>}
        items={items}
        title="Confirmacao"
      />,
    )

    expect(view.getByText('Confirmacao')).toBeTruthy()
    expect(view.getByText('Montante')).toBeTruthy()
    expect(view.getByText('4,70€')).toBeTruthy()
    expect(view.getByText('Canal')).toBeTruthy()
    expect(view.getByText('Pagamento instantaneo')).toBeTruthy()
    expect(view.getByText('Aviso')).toBeTruthy()
  })
})
