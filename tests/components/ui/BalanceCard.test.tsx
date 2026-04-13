import { fireEvent, render } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import { BalanceCard } from '@/components/ui/BalanceCard'
import { config } from '@/tamagui.config'
import { themes } from '@/themes'
import { renderWithProvider, renderWithTheme } from '@tests/support/test-utils'

const fallbackSafeAreaMetrics = {
  frame: { height: 0, width: 0, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
}

describe('BalanceCard', () => {
  it('renders values and handles the primary action', () => {
    const onActionPress = jest.fn()
    const view = renderWithProvider(
      <BalanceCard
        actionLabel="Receber"
        amount="4,70€"
        caption="Saldo pronto para levantamento."
        eyebrow="Saldo disponivel"
        footer={<Text>24 devolucoes</Text>}
        onActionPress={onActionPress}
      />,
    )

    fireEvent.press(view.getByText('Receber'))

    expect(view.getByText('Saldo disponivel')).toBeTruthy()
    expect(view.getByText('4,70€')).toBeTruthy()
    expect(view.getByText('24 devolucoes')).toBeTruthy()
    expect(onActionPress).toHaveBeenCalledTimes(1)
  })

  it('keeps accent-card values at full contrast in dark theme', () => {
    const view = renderWithTheme(<BalanceCard amount="4,70€" />, {
      defaultTheme: 'dark',
    })
    const amount = view.getByText('4,70€')
    const style = StyleSheet.flatten(amount.props.style)

    expect(style?.color).toBe(themes.dark_accent.color)
  })

  it('updates amount colors when the theme changes at runtime', () => {
    const view = render(
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics ?? fallbackSafeAreaMetrics}
      >
        <TamaguiProvider config={config} defaultTheme="light">
          <BalanceCard amount="4,70€" />
        </TamaguiProvider>
      </SafeAreaProvider>,
    )

    let amount = view.getByText('4,70€')

    expect(StyleSheet.flatten(amount.props.style)?.color).toBe(
      themes.light_accent.color,
    )

    view.rerender(
      <SafeAreaProvider
        initialMetrics={initialWindowMetrics ?? fallbackSafeAreaMetrics}
      >
        <TamaguiProvider config={config} defaultTheme="dark">
          <BalanceCard amount="4,70€" />
        </TamaguiProvider>
      </SafeAreaProvider>,
    )

    amount = view.getByText('4,70€')

    expect(StyleSheet.flatten(amount.props.style)?.color).toBe(
      themes.dark_accent.color,
    )
  })

  it('renders the optional title without requiring a button', () => {
    const view = renderWithProvider(
      <BalanceCard amount="4,70€" title="Saldo atual" />,
    )

    expect(view.getByText('Saldo atual')).toBeTruthy()
    expect(view.getByText('4,70€')).toBeTruthy()
    expect(view.queryByText('Receber')).toBeNull()
  })
})
