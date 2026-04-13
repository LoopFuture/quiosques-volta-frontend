import {
  mockRouterBack,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen } from '@testing-library/react-native'
import ProfileHelpScreen from '@/features/profile/screens/ProfileHelpScreen'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileHelpScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
  })

  it('completes the help flow and navigates back', () => {
    renderWithProvider(<ProfileHelpScreen />)

    fireEvent.press(screen.getByText('complete-help'))

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })
})
