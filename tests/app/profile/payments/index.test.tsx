import ProfilePaymentsRoute from '@/app/profile/payments'
import { ProfilePaymentsScreen } from '@/features/profile/screens/ProfilePaymentsScreen'

describe('app/profile/payments route', () => {
  it('re-exports the profile payments screen', () => {
    expect(ProfilePaymentsRoute).toBe(ProfilePaymentsScreen)
  })
})
