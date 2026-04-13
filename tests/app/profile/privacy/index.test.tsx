import ProfilePrivacyRoute from '@/app/profile/privacy'
import { ProfilePrivacyScreen } from '@/features/profile/screens/ProfilePrivacyScreen'

describe('app/profile/privacy route', () => {
  it('re-exports the profile privacy screen', () => {
    expect(ProfilePrivacyRoute).toBe(ProfilePrivacyScreen)
  })
})
