import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TransactionListItem } from '@/components/ui/TransactionListItem'
import { mockWindowDimensions } from '../support/react-native'
import { renderWithProvider } from '../support/test-utils'

describe('TransactionListItem', () => {
  it('renders transaction data and status badge', () => {
    const view = renderWithProvider(
      <TransactionListItem
        amount="+0,50€"
        badgeLabel="Pago"
        badgeTone="success"
        icon={<Text>R</Text>}
        subtitle="SPIN · 5 emb."
        title="Cafe Central"
      />,
    )

    expect(view.getByText('Cafe Central')).toBeTruthy()
    expect(view.getByText('SPIN · 5 emb.')).toBeTruthy()
    expect(view.getByText('+0,50€')).toBeTruthy()
    expect(view.getByText('Pago')).toBeTruthy()
    expect(view.queryByLabelText('Cafe Central')).toBeNull()
  })

  it('supports interactive rows without changing the static layout', () => {
    const onPress = jest.fn()
    const view = renderWithProvider(
      <TransactionListItem
        accessibilityLabel="Abrir Cafe Central"
        amount="+0,50€"
        badgeLabel="Pago"
        badgeTone="success"
        icon={<Text>R</Text>}
        onPress={onPress}
        subtitle="SPIN · 5 emb."
        title="Cafe Central"
      />,
    )

    fireEvent.press(view.getByLabelText('Abrir Cafe Central'))

    expect(view.getByText('Cafe Central')).toBeTruthy()
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('supports compact unframed rows with long badges and default accessibility labels', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const onPress = jest.fn()
    const view = renderWithProvider(
      <TransactionListItem
        amount="-4,70€"
        badgeLabel="Transferência em processamento"
        framed={false}
        icon={<Text>T</Text>}
        onPress={onPress}
        title="Transferência longa"
      />,
    )

    fireEvent.press(view.getByLabelText('Transferência longa'))

    expect(view.getByText('Transferência em processamento')).toBeTruthy()
    expect(view.queryByText('SPIN · 5 emb.')).toBeNull()
    expect(onPress).toHaveBeenCalledTimes(1)

    windowSpy.mockRestore()
  })
})
