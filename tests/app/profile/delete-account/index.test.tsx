import ProfileDeleteAccountRoute from '@/app/profile/delete-account'
import { ProfileDeleteAccountScreen } from '@/features/profile/screens/ProfileDeleteAccountScreen'

describe('app/profile/delete-account route', () => {
  it('re-exports the profile delete account screen', () => {
    expect(ProfileDeleteAccountRoute).toBe(ProfileDeleteAccountScreen)
  })
})
