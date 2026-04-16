import { screen } from '@testing-library/react-native'
import { WalletMovementSummaryCard } from '@/features/wallet/components/WalletMovementSummaryCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('@tamagui/lucide-icons', () => ({
  ArrowUpRight: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>ArrowUpRight</Text>
  },
  Check: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>Check</Text>
  },
  X: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>X</Text>
  },
}))

describe('WalletMovementSummaryCard', () => {
  it('renders movement summary cards for success, warning, and error states', () => {
    const view = renderWithProvider(
      <WalletMovementSummaryCard
        amount="4,70 €"
        description="Descrição"
        status="completed"
        title="Transferência"
        tone="accent"
      />,
    )

    expect(screen.getByText('Check')).toBeTruthy()
    expect(screen.queryByText('Concluída')).toBeNull()

    view.unmount()

    renderWithProvider(
      <WalletMovementSummaryCard
        amount="4,70 €"
        description="Descrição"
        status="processing"
        title="Transferência"
        tone="warning"
      />,
    )

    expect(screen.getByText('ArrowUpRight')).toBeTruthy()

    renderWithProvider(
      <WalletMovementSummaryCard
        amount="4,70 €"
        description="Descrição"
        status="failed"
        title="Transferência"
        tone="error"
      />,
    )

    expect(screen.getByText('X')).toBeTruthy()
  })

  it('expands the amount text for larger accessibility text sizes', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.2, width: 390 })

    renderWithProvider(
      <WalletMovementSummaryCard
        amount="1 234 567,89 €"
        description="Descrição"
        status="completed"
        title="Transferência"
        tone="accent"
      />,
    )

    expect(
      screen.getByText('1 234 567,89 €').props.numberOfLines,
    ).toBeUndefined()

    windowSpy.mockRestore()
  })
})
