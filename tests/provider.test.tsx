import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import * as ReactNative from 'react-native'
import { Provider } from '@/components/Provider'

const mockUseToastState = jest.fn()

jest.mock('@tamagui/toast', () => {
  const { View } = jest.requireActual('react-native')

  return {
    Toast: Object.assign(({ children }: any) => <View>{children}</View>, {
      Description: ({ children }: any) => <View>{children}</View>,
      Title: ({ children }: any) => <View>{children}</View>,
    }),
    ToastProvider: ({ children, duration, swipeDirection, native }: any) => (
      <View
        testID="toast-provider"
        accessibilityLabel={`${swipeDirection}:${duration}:${native.length}`}
      >
        {children}
      </View>
    ),
    ToastViewport: () => <View testID="toast-viewport" />,
    useToastController: () => ({
      hide: jest.fn(),
      show: jest.fn(),
    }),
    useToastState: () => mockUseToastState(),
  }
})

jest.mock('tamagui', () => {
  const actual = jest.requireActual('tamagui')
  const { View } = jest.requireActual('react-native')

  return {
    ...actual,
    TamaguiProvider: ({ children, defaultTheme }: any) => (
      <View testID="tamagui-provider" accessibilityLabel={defaultTheme}>
        {children}
      </View>
    ),
  }
})

describe('provider behavior', () => {
  const useColorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastState.mockReturnValue(null)
    useColorSchemeSpy.mockReturnValue('light')
  })

  afterAll(() => {
    useColorSchemeSpy.mockRestore()
  })

  it('uses the dark theme when the device is dark', () => {
    useColorSchemeSpy.mockReturnValue('dark')

    render(
      <Provider>
        <Text>Child content</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('dark')
    expect(screen.getByTestId('toast-provider').props.accessibilityLabel).toBe(
      'horizontal:6000:0',
    )
    expect(screen.getByTestId('toast-viewport')).toBeTruthy()
    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('falls back to the light theme when the device scheme is not dark', () => {
    useColorSchemeSpy.mockReturnValue('light')

    render(
      <Provider>
        <Text>Fallback theme</Text>
      </Provider>,
    )

    expect(
      screen.getByTestId('tamagui-provider').props.accessibilityLabel,
    ).toBe('light')
    expect(screen.getByText('Fallback theme')).toBeTruthy()
  })
})
