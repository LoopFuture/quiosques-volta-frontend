import ProfileAppSettingsRoute from '@/app/profile/app-settings'
import { ProfileAppSettingsScreen } from '@/features/profile/screens/ProfileAppSettingsScreen'

describe('app/profile/app-settings route', () => {
  it('re-exports the profile app settings screen', () => {
    expect(ProfileAppSettingsRoute).toBe(ProfileAppSettingsScreen)
  })
})
