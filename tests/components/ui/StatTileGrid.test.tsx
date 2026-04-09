import { Text } from 'react-native'
import { StatTileGrid } from '@/components/ui/StatTileGrid'
import { renderWithProvider } from '@tests/support/test-utils'

describe('StatTileGrid', () => {
  it('renders empty and multi-row grids without crashing', () => {
    const emptyView = renderWithProvider(<StatTileGrid>{null}</StatTileGrid>)

    expect(emptyView.toJSON()).toBeTruthy()

    emptyView.unmount()

    const view = renderWithProvider(
      <StatTileGrid>
        <Text>Primeiro</Text>
        <Text>Segundo</Text>
        <Text>Terceiro</Text>
      </StatTileGrid>,
    )

    expect(view.getByText('Primeiro')).toBeTruthy()
    expect(view.getByText('Segundo')).toBeTruthy()
    expect(view.getByText('Terceiro')).toBeTruthy()
  })
})
