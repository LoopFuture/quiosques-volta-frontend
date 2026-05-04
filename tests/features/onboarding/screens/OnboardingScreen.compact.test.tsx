import { waitFor } from '@testing-library/react-native'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'
import { setLocaleOverrideForTests, syncLocale } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    fontScale: 1,
    height: 640,
    scale: 2,
    width: 320,
  })),
}))

describe('onboarding screen compact layout', () => {
  it('renders the compact footer actions in a scrollable layout', () => {
    const view = renderWithProvider(<OnboardingScreen onComplete={jest.fn()} />)

    expect(view.getByTestId('onboarding-screen-scroll-view')).toBeTruthy()
    expect(view.getByTestId('onboarding-next-button')).toBeTruthy()
    expect(view.getByTestId('onboarding-later-button')).toBeTruthy()
    expect(
      view.getByText('Desliza ou toca em Continuar para ver o passo seguinte.'),
    ).toBeTruthy()
  })

  it('renders the onboarding copy in English when the locale changes', async () => {
    setLocaleOverrideForTests('en-GB')
    syncLocale('system')

    try {
      const view = renderWithProvider(
        <OnboardingScreen onComplete={jest.fn()} />,
      )

      await waitFor(() => {
        expect(
          view.getByText('Return and get paid without surprises'),
        ).toBeTruthy()
        expect(
          view.getByText('Swipe or tap Continue to see the next step.'),
        ).toBeTruthy()
      })
    } finally {
      setLocaleOverrideForTests(null)
      syncLocale('system')
    }
  })
})
