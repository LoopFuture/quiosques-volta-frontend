import type { ReactElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { config } from '@/tamagui.config'
import { CurrentToast, ToastControl } from '@/components/CurrentToast'

const mockUseToastState = jest.fn()
const mockShowToast = jest.fn()
const mockHideToast = jest.fn()

jest.mock('@tamagui/toast', () => {
  const { Text, View } = jest.requireActual('react-native')

  function MockToast({ children }: any) {
    return <View testID="toast">{children}</View>
  }

  function MockToastTitle({ children }: any) {
    return <Text>{children}</Text>
  }

  function MockToastDescription({ children }: any) {
    return <Text>{children}</Text>
  }

  MockToast.Title = MockToastTitle
  MockToast.Description = MockToastDescription

  return {
    Toast: MockToast,
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
      hide: mockHideToast,
      show: mockShowToast,
    }),
    useToastState: () => mockUseToastState(),
  }
})

function renderWithTheme(ui: ReactElement) {
  return render(
    <TamaguiProvider config={config} defaultTheme="light">
      {ui}
    </TamaguiProvider>,
  )
}

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

  it('shows and hides the toast from the demo controls', () => {
    renderWithTheme(<ToastControl />)

    fireEvent.press(screen.getByText('Show'))
    fireEvent.press(screen.getByText('Hide'))

    expect(mockShowToast).toHaveBeenCalledWith('Successfully saved!', {
      message: "Don't worry, we've got your data.",
    })
    expect(mockHideToast).toHaveBeenCalled()
  })
})
