import ProfilePersonalRoute from '@/app/profile/personal'
import { ProfilePersonalScreen } from '@/features/profile/screens/ProfilePersonalScreen'

describe('app/profile/personal route', () => {
  it('re-exports the profile personal screen', () => {
    expect(ProfilePersonalRoute).toBe(ProfilePersonalScreen)
  })
})
