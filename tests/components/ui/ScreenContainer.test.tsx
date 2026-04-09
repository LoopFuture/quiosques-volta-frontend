import { StyleSheet, Text } from 'react-native'
import { ScreenContainer } from '@/components/ui/ScreenContainer'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const mockUseSafeAreaInsets = jest.fn(() => ({
    bottom: 18,
    left: 6,
    right: 6,
    top: 24,
  }))

  return {
    SafeAreaProvider: ({ children }: any) =>
      React.createElement(View, null, children),
    initialWindowMetrics: null,
    useSafeAreaInsets: mockUseSafeAreaInsets,
    __mockUseSafeAreaInsets: mockUseSafeAreaInsets,
  }
})

const { __mockUseSafeAreaInsets: mockUseSafeAreaInsets } = jest.requireMock(
  'react-native-safe-area-context',
)

describe('ScreenContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders header, content, footer, and test id', () => {
    const view = renderWithProvider(
      <ScreenContainer
        footer={<Text>Footer actions</Text>}
        header={<Text>Header content</Text>}
        testID="screen-shell"
      >
        <Text>Screen content</Text>
      </ScreenContainer>,
    )

    expect(view.getByTestId('screen-shell')).toBeTruthy()
    expect(view.getByText('Header content')).toBeTruthy()
    expect(view.getByText('Screen content')).toBeTruthy()
    expect(view.getByText('Footer actions')).toBeTruthy()
  })

  it('keeps the header rendered when the body is scrollable', () => {
    const view = renderWithProvider(
      <ScreenContainer header={<Text>Fixed header</Text>} scrollable>
        <Text>Scrollable body</Text>
      </ScreenContainer>,
    )

    expect(view.getByText('Fixed header')).toBeTruthy()
    expect(view.getByText('Scrollable body')).toBeTruthy()
  })

  it('uses flex grow on the scroll content container', () => {
    const view = renderWithProvider(
      <ScreenContainer scrollable testID="scroll-shell">
        <Text>Scrollable body</Text>
      </ScreenContainer>,
    )

    expect(
      view.getByTestId('scroll-shell-scroll-view').props.contentContainerStyle,
    ).toEqual({
      flexGrow: 1,
    })
  })

  it('passes custom props to the content container', () => {
    const view = renderWithProvider(
      <ScreenContainer contentProps={{ testID: 'screen-content' }}>
        <Text>Custom content props</Text>
      </ScreenContainer>,
    )

    expect(view.getByTestId('screen-content')).toBeTruthy()
    expect(view.getByText('Custom content props')).toBeTruthy()
  })

  it('adds the bottom safe-area inset when requested', () => {
    const view = renderWithProvider(
      <ScreenContainer
        bottomInset
        header={<Text>Inset header</Text>}
        testID="screen-shell"
      >
        <Text>Inset body</Text>
      </ScreenContainer>,
    )

    expect(mockUseSafeAreaInsets).toHaveBeenCalled()
    expect(
      StyleSheet.flatten(view.getByTestId('screen-shell').props.style)
        .paddingBottom,
    ).toBe(18)
    expect(view.getByText('Inset header')).toBeTruthy()
  })
})
