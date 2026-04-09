import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { WalletDetailScreenFrame } from '@/features/wallet/components/WalletDetailScreenFrame'
import { WalletMovementIcon } from '@/features/wallet/components/WalletMovementIcon'
import { WalletMovementSummaryCard } from '@/features/wallet/components/WalletMovementSummaryCard'
import { WalletReceiptCard } from '@/features/wallet/components/WalletReceiptCard'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual('@/components/ui')

  return {
    ...actual,
    DetailScreenFrame: jest.fn(() => null),
  }
})

jest.mock('@tamagui/lucide-icons', () => ({
  ArrowUpRight: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>ArrowUpRight</Text>
  },
  Check: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>Check</Text>
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
  X: () => {
    const { Text } = jest.requireActual('react-native')
    return <Text>X</Text>
  },
}))

const { DetailScreenFrame: mockDetailScreenFrame } =
  jest.requireMock('@/components/ui')

describe('wallet components', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('passes the translated back label into the wallet detail frame', () => {
    renderWithProvider(
      <WalletDetailScreenFrame
        description="Descrição"
        testID="wallet-detail-frame"
        title="Carteira"
      >
        <Text>content</Text>
      </WalletDetailScreenFrame>,
    )

    expect(mockDetailScreenFrame).toHaveBeenCalledWith(
      expect.objectContaining({
        backLabel: i18n.t('tabScreens.wallet.common.backLabel'),
      }),
      undefined,
    )
  })

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

  it('renders receipt cards in regular and compact layouts with primitive and custom values', () => {
    const widthSpy = mockWindowDimensions({ width: 390 })
    const view = renderWithProvider(
      <WalletReceiptCard
        footer={<Text>Footer content</Text>}
        items={[
          {
            helper: 'helper',
            label: 'Montante',
            tone: 'accent',
            value: '4,70 €',
          },
          {
            label: 'Conta',
            value: <Text>Custom node</Text>,
          },
        ]}
        testID="wallet-receipt-card"
        title="Recibo"
      />,
    )

    expect(screen.getByTestId('wallet-receipt-card')).toBeTruthy()
    expect(screen.getByText('Recibo')).toBeTruthy()
    expect(screen.getByText('helper')).toBeTruthy()
    expect(screen.getByText('Footer content')).toBeTruthy()
    expect(screen.getByText('Custom node')).toBeTruthy()

    widthSpy.mockRestore()
    const compactSpy = mockWindowDimensions({ width: 320 })

    view.unmount()

    renderWithProvider(
      <WalletReceiptCard
        items={[
          {
            helper: 'compact helper',
            label: 'Montante',
            value: '4,70 €',
          },
        ]}
        title="Compacto"
      />,
    )

    expect(screen.getByText('Compacto')).toBeTruthy()
    expect(screen.getByText('compact helper')).toBeTruthy()

    compactSpy.mockRestore()
  })
})
