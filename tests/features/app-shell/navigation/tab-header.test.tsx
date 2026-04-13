import { render } from '@testing-library/react-native'
import {
  StackTopBar,
  TabTopBar,
} from '@/features/app-shell/navigation/tab-header'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@/components/ui/TopBar', () => ({
  TopBar: jest.fn(() => null),
}))

const { TopBar: mockTopBar } = jest.requireMock('@/components/ui/TopBar')

describe('tab-header navigation helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds the home tab header with the optional home title override', () => {
    render(<TabTopBar homeTitle="Ola, Joao" routeName="index" />)

    expect(mockTopBar).toHaveBeenCalledWith(
      expect.objectContaining({
        eyebrow: 'tabs.home.header.eyebrow',
        title: 'Ola, Joao',
        variant: 'home',
      }),
      undefined,
    )
  })

  it('builds title headers for non-home tabs', () => {
    render(<TabTopBar routeName="wallet" />)

    expect(mockTopBar).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'tabs.wallet.title',
        variant: 'title',
      }),
      undefined,
    )
  })

  it('wires the stack top bar back and right actions', () => {
    const onBackPress = jest.fn()
    const onRightPress = jest.fn()

    render(
      <StackTopBar
        backLabel="Voltar"
        eyebrow="Wallet"
        onBackPress={onBackPress}
        rightAction={{
          icon: null,
          label: 'Edit',
          onPress: onRightPress,
        }}
        subtitle="Detalhe"
        title="Movimento"
      />,
    )

    const [{ leftAction, rightAction, ...props }] = mockTopBar.mock.calls[0]

    expect(props).toEqual(
      expect.objectContaining({
        eyebrow: 'Wallet',
        subtitle: 'Detalhe',
        title: 'Movimento',
        variant: 'title',
      }),
    )

    leftAction.onPress()
    rightAction.onPress()

    expect(leftAction.label).toBe('Voltar')
    expect(onBackPress).toHaveBeenCalledTimes(1)
    expect(onRightPress).toHaveBeenCalledTimes(1)
  })
})
