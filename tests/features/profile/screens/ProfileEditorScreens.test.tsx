import * as ProfileEditorScreens from '@/features/profile/screens/ProfileEditorScreens'
import { ProfileAppSettingsScreen as DirectProfileAppSettingsScreen } from '@/features/profile/screens/ProfileAppSettingsScreen'
import { ProfilePaymentsScreen as DirectProfilePaymentsScreen } from '@/features/profile/screens/ProfilePaymentsScreen'
import { ProfilePersonalScreen as DirectProfilePersonalScreen } from '@/features/profile/screens/ProfilePersonalScreen'
import { ProfilePrivacyScreen as DirectProfilePrivacyScreen } from '@/features/profile/screens/ProfilePrivacyScreen'
describe('profile editor and detail screens', () => {
  it('re-exports the editor screens through the feature barrel', () => {
    expect(ProfileEditorScreens.ProfileAppSettingsScreen).toBe(
      DirectProfileAppSettingsScreen,
    )
    expect(ProfileEditorScreens.ProfilePaymentsScreen).toBe(
      DirectProfilePaymentsScreen,
    )
    expect(ProfileEditorScreens.ProfilePersonalScreen).toBe(
      DirectProfilePersonalScreen,
    )
    expect(ProfileEditorScreens.ProfilePrivacyScreen).toBe(
      DirectProfilePrivacyScreen,
    )
  })
})
