import { fireEvent, screen } from '@testing-library/react-native'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { renderWithProvider } from '@tests/support/test-utils'

describe('onboarding screen', () => {
  it('renders the first onboarding step', () => {
    renderWithProvider(<OnboardingScreen onComplete={jest.fn()} />)

    expect(screen.getByTestId('onboarding-screen')).toBeTruthy()
    expect(screen.getByText('Devolve e recebe sem surpresas')).toBeTruthy()
    expect(screen.getByText('Escolhe uma máquina perto de ti')).toBeTruthy()
    expect(screen.getByText('1 de 4')).toBeTruthy()
    expect(screen.getByTestId('onboarding-next-button')).toBeTruthy()
  })

  it('advances to the next step when pressing next', () => {
    renderWithProvider(<OnboardingScreen onComplete={jest.fn()} />)

    fireEvent.press(screen.getByTestId('onboarding-next-button'))

    expect(screen.getByText('2 de 4')).toBeTruthy()
  })

  it('updates the active step after a horizontal swipe', () => {
    renderWithProvider(<OnboardingScreen onComplete={jest.fn()} />)

    fireEvent(screen.getByTestId('onboarding-list'), 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { x: 600, y: 0 },
        layoutMeasurement: { height: 780, width: 300 },
      },
    })

    expect(screen.getByText('3 de 4')).toBeTruthy()
  })

  it('completes the flow when pressing later', () => {
    const handleComplete = jest.fn()

    renderWithProvider(<OnboardingScreen onComplete={handleComplete} />)

    fireEvent.press(screen.getByTestId('onboarding-later-button'))

    expect(handleComplete).toHaveBeenCalledTimes(1)
  })

  it('completes the flow from the final get started action', () => {
    const handleComplete = jest.fn()

    renderWithProvider(<OnboardingScreen onComplete={handleComplete} />)

    fireEvent.press(screen.getByTestId('onboarding-next-button'))
    fireEvent.press(screen.getByTestId('onboarding-next-button'))
    fireEvent.press(screen.getByTestId('onboarding-next-button'))

    expect(screen.getByText('4 de 4')).toBeTruthy()

    fireEvent.press(screen.getByTestId('onboarding-get-started-button'))

    expect(handleComplete).toHaveBeenCalledTimes(1)
  })

  it('renders the review-mode close action on the last step', () => {
    const handleComplete = jest.fn()

    renderWithProvider(
      <OnboardingScreen
        backLabel="Back"
        onBackPress={jest.fn()}
        onComplete={handleComplete}
        title="How Volta works"
        variant="review"
      />,
    )

    fireEvent.press(screen.getByTestId('onboarding-next-button'))
    fireEvent.press(screen.getByTestId('onboarding-next-button'))
    fireEvent.press(screen.getByTestId('onboarding-next-button'))

    expect(screen.getByText('Fechar introdução')).toBeTruthy()
    expect(
      screen.getByText('Tudo pronto. Fecha esta introdução quando quiseres.'),
    ).toBeTruthy()
    expect(screen.getByTestId('onboarding-close-button')).toBeTruthy()
    expect(screen.queryByTestId('onboarding-later-button')).toBeNull()

    fireEvent.press(screen.getByTestId('onboarding-close-button'))

    expect(handleComplete).toHaveBeenCalledTimes(1)
  })
})
