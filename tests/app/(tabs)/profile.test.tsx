import ProfileRoute from '@/app/(tabs)/profile'
import ProfileScreen from '@/features/profile/screens/ProfileScreen'

describe('app/(tabs)/profile route', () => {
  it('re-exports the profile feature screen', () => {
    expect(ProfileRoute).toBe(ProfileScreen)
  })
})
