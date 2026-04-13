import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { WalletReceiptCard } from '@/features/wallet/components/WalletReceiptCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

describe('WalletReceiptCard', () => {
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
