import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    fontScale: 1,
    height: 568,
    scale: 2,
    width: 320,
  })),
}))

describe('onboarding screen compact layout', () => {
  it('renders the compact footer actions', () => {
    const view = renderWithProvider(<OnboardingScreen onComplete={jest.fn()} />)

    expect(view.getByTestId('onboarding-next-button')).toBeTruthy()
    expect(view.getByTestId('onboarding-later-button')).toBeTruthy()
    expect(
      view.getByText('Desliza ou toca em Continuar para ver o passo seguinte.'),
    ).toBeTruthy()
  })
})
