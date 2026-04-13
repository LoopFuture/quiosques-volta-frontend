import {
  mockSetLanguageMode,
  mockSetThemeMode,
  mockShowSuccess,
  resetProfileEditorScreenMocks,
  restoreProfileEditorScreenLocale,
} from '@tests/support/profile-editor-screen-mocks'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { ProfileAppSettingsScreen } from '@/features/profile/screens/ProfileAppSettingsScreen'
import { i18n } from '@/i18n'
import { renderWithProvider } from '@tests/support/test-utils'

describe('ProfileAppSettingsScreen', () => {
  beforeEach(() => {
    resetProfileEditorScreenMocks()
  })

  afterAll(() => {
    restoreProfileEditorScreenLocale()
  })

  it('updates appearance and language preferences from app settings', async () => {
    renderWithProvider(<ProfileAppSettingsScreen />)

    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.appSettings.appearance.darkOption'),
      ),
    )
    fireEvent.press(
      screen.getByText(
        i18n.t('tabScreens.profile.appSettings.language.englishOption'),
      ),
    )

    await waitFor(() => {
      expect(mockSetThemeMode).toHaveBeenCalledWith('dark')
      expect(mockSetLanguageMode).toHaveBeenCalledWith('en')
    })

    expect(mockShowSuccess).toHaveBeenNthCalledWith(
      1,
      i18n.t('tabScreens.profile.appSettings.appearance.title'),
      i18n.t('tabScreens.profile.appSettings.savedToast'),
    )
    expect(mockShowSuccess).toHaveBeenNthCalledWith(
      2,
      i18n.t('tabScreens.profile.appSettings.language.title'),
      i18n.t('tabScreens.profile.appSettings.savedToast'),
    )
  })
})
