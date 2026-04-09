import { screen } from '@testing-library/react-native'
import { WalletMovementSummaryCard } from '@/features/wallet/components/WalletMovementSummaryCard'
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
        stateLabel="Concluída"
        status="completed"
        title="Transferência"
        tone="accent"
      />,
    )

    expect(screen.getByText('Check')).toBeTruthy()
    expect(screen.getByText('Concluída')).toBeTruthy()

    view.unmount()

    renderWithProvider(
      <WalletMovementSummaryCard
        amount="4,70 €"
        description="Descrição"
        stateLabel="Em processo"
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
        stateLabel="Falhou"
        status="failed"
        title="Transferência"
        tone="error"
      />,
    )

    expect(screen.getByText('X')).toBeTruthy()
  })
})
