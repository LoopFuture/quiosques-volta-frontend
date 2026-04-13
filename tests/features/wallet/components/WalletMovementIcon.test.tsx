import { screen } from '@testing-library/react-native'
import { WalletMovementIcon } from '@/features/wallet/components/WalletMovementIcon'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('@tamagui/lucide-icons', () => ({
  ArrowUpRight: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>ArrowUpRight</Text>
  },
  GlassWater: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>GlassWater</Text>
  },
  Milk: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>Milk</Text>
  },
  Recycle: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>Recycle</Text>
  },
}))

describe('WalletMovementIcon', () => {
  it('renders the correct movement icon for each transaction type and fallback', () => {
    const view = renderWithProvider(<WalletMovementIcon type="credit" />)

    expect(screen.getByText('Recycle')).toBeTruthy()

    view.unmount()
    renderWithProvider(<WalletMovementIcon type="adjustment" />)
    expect(screen.getByText('GlassWater')).toBeTruthy()

    renderWithProvider(<WalletMovementIcon type="transfer_debit" />)
    expect(screen.getByText('ArrowUpRight')).toBeTruthy()

    renderWithProvider(<WalletMovementIcon type={'unexpected' as never} />)
    expect(screen.getByText('Milk')).toBeTruthy()
  })
})
