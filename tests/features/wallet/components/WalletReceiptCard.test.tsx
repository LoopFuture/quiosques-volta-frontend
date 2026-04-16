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

  it('switches to the compact layout when accessibility text is enlarged', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.2, width: 390 })

    renderWithProvider(
      <WalletReceiptCard
        items={[
          {
            helper: 'Conta para receber o montante transferido',
            label: 'Conta associada',
            value: 'PT50 0002 0123 1234 5678 9015 4',
          },
        ]}
        title="Detalhes"
      />,
    )

    expect(
      screen.getByText('Conta para receber o montante transferido'),
    ).toBeTruthy()

    windowSpy.mockRestore()
  })
})
