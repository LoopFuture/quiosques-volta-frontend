import ProfileAlertsRoute from '@/app/profile/alerts'
import { ProfileAlertsScreen } from '@/features/profile/screens/ProfileAlertsScreen'

describe('app/profile/alerts route', () => {
  it('re-exports the profile alerts screen', () => {
    expect(ProfileAlertsRoute).toBe(ProfileAlertsScreen)
  })
})
