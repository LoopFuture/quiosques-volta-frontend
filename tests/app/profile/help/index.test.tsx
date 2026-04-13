import ProfileHelpRoute from '@/app/profile/help'
import ProfileHelpScreen from '@/features/profile/screens/ProfileHelpScreen'

describe('app/profile/help route', () => {
  it('re-exports the profile help screen', () => {
    expect(ProfileHelpRoute).toBe(ProfileHelpScreen)
  })
})
