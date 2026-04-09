import { Text } from 'react-native'
import { DetailCard } from '@/components/ui/DetailCard'
import type { DetailItem } from '@/components/ui/types'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

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

  it('renders compact rows without a title for numeric and custom values', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const items: DetailItem[] = [
      {
        helper: 'Itens recebidos',
        label: 'Contagem',
        tone: 'success',
        value: 3,
      },
      {
        label: 'Conta',
        value: <Text>Nó personalizado</Text>,
      },
    ]

    const view = renderWithProvider(<DetailCard items={items} />)

    expect(view.queryByText('Confirmacao')).toBeNull()
    expect(view.getByText('Contagem')).toBeTruthy()
    expect(view.getByText('Itens recebidos')).toBeTruthy()
    expect(view.getByText('3')).toBeTruthy()
    expect(view.getByText('Nó personalizado')).toBeTruthy()

    windowSpy.mockRestore()
  })
})
