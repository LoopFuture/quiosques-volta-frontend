import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TransactionListItem } from '@/components/ui/TransactionListItem'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

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
        accessibilityHint="Abre os detalhes"
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
    expect(view.getByHintText('Abre os detalhes')).toBeTruthy()
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

  it('uses the title as the default accessibility label for framed interactive rows', () => {
    const onPress = jest.fn()
    const view = renderWithProvider(
      <TransactionListItem
        amount="-4,70€"
        icon={<Text>T</Text>}
        onPress={onPress}
        title="Transferência"
      />,
    )

    fireEvent.press(view.getByLabelText('Transferência'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders compact static rows without press affordances, subtitles, or badges', () => {
    const windowSpy = mockWindowDimensions({ width: 320 })
    const view = renderWithProvider(
      <TransactionListItem
        amount="-4,70€"
        framed={false}
        icon={<Text>T</Text>}
        subtitle="Sem ação"
        title="Transferência estática"
      />,
    )

    expect(view.getByText('Transferência estática')).toBeTruthy()
    expect(view.getByText('Sem ação')).toBeTruthy()
    expect(view.queryByLabelText('Transferência estática')).toBeNull()

    windowSpy.mockRestore()
  })

  it('uses the compact stacked layout when larger text is enabled at regular width', () => {
    const windowSpy = mockWindowDimensions({ fontScale: 1.3, width: 390 })
    const view = renderWithProvider(
      <TransactionListItem
        amount="-4,70€"
        badgeLabel="Transferência em processamento"
        icon={<Text>T</Text>}
        subtitle="Conta terminada em 4321"
        title="Transferência"
      />,
    )

    expect(view.getByText('Transferência').props.numberOfLines).toBe(4)
    expect(view.getByText('Conta terminada em 4321').props.numberOfLines).toBe(
      3,
    )
    expect(
      view.getByText('Transferência em processamento').props.numberOfLines,
    ).toBe(3)

    windowSpy.mockRestore()
  })
})
