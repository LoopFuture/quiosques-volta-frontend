import ProfileSummaryRoute from '@/app/profile/summary'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'

describe('app/profile/summary route', () => {
  it('re-exports the profile summary screen', () => {
    expect(ProfileSummaryRoute).toBe(ProfileSummaryScreen)
  })
})
