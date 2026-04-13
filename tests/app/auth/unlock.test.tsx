import UnlockRoute from '@/app/auth/unlock'
import UnlockScreen from '@/features/auth/screens/UnlockScreen'

describe('app/auth/unlock route', () => {
  it('re-exports the unlock feature screen', () => {
    expect(UnlockRoute).toBe(UnlockScreen)
  })
})
