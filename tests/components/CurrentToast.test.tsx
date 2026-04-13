import { screen } from '@testing-library/react-native'
import { CurrentToast } from '@/components/CurrentToast'
import type { MockToastProviderProps } from '@tests/support/tamagui-toast-mock'
import { renderWithTheme } from '@tests/support/test-utils'

const mockUseToastState = jest.fn()
const mockShowToast = jest.fn()
const mockHideToast = jest.fn()

jest.mock('@tamagui/toast', () => {
  const { View } = jest.requireActual('react-native')
  const { createTamaguiToastMock } = jest.requireActual(
    '@tests/support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getHideToast: () => mockHideToast,
    getShowToast: () => mockShowToast,
    renderToastProvider: ({
      children,
      duration,
      swipeDirection,
      native,
    }: MockToastProviderProps) => (
      <View
        testID="toast-provider"
        accessibilityLabel={`${swipeDirection}:${duration}:${native?.length ?? 0}`}
      >
        {children}
      </View>
    ),
    renderToastViewport: () => <View testID="toast-viewport" />,
    toastTestID: 'toast',
    useToastState: () => mockUseToastState(),
  })
})

describe('toast behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToastState.mockReturnValue(null)
  })

  it('does not render a toast when there is no active toast', () => {
    renderWithTheme(<CurrentToast />)

    expect(screen.queryByTestId('toast')).toBeNull()
  })

  it('does not render a toast when it is handled natively', () => {
    mockUseToastState.mockReturnValue({
      id: 'native',
      isHandledNatively: true,
    })

    renderWithTheme(<CurrentToast />)

    expect(screen.queryByTestId('toast')).toBeNull()
  })

  it('renders the active toast title and message', () => {
    mockUseToastState.mockReturnValue({
      duration: 6000,
      id: 'toast-1',
      isHandledNatively: false,
      message: 'Saved to storage.',
      title: 'Saved',
      viewportName: 'default',
    })

    renderWithTheme(<CurrentToast />)

    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.getByText('Saved to storage.')).toBeTruthy()
  })

  it('omits the description when the active toast has no message', () => {
    mockUseToastState.mockReturnValue({
      duration: 6000,
      id: 'toast-2',
      isHandledNatively: false,
      title: 'Saved',
      viewportName: 'default',
    })

    renderWithTheme(<CurrentToast />)

    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.queryByText('Saved to storage.')).toBeNull()
  })

  it('renders error toasts', () => {
    mockUseToastState.mockReturnValue({
      duration: 5000,
      id: 'toast-3',
      isHandledNatively: false,
      message: 'Please try again.',
      title: 'Failed',
      variant: 'error',
      viewportName: 'default',
    })

    renderWithTheme(<CurrentToast />)

    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Please try again.')).toBeTruthy()
  })

  it('renders hint toasts', () => {
    mockUseToastState.mockReturnValue({
      duration: 2500,
      id: 'toast-4',
      isHandledNatively: false,
      message: 'Pull to refresh.',
      title: 'Hint',
      variant: 'hint',
      viewportName: 'default',
    })

    renderWithTheme(<CurrentToast />)

    expect(screen.getByText('Hint')).toBeTruthy()
    expect(screen.getByText('Pull to refresh.')).toBeTruthy()
  })
})
