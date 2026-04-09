import SetupRoute from '@/app/setup'
import { ProfileSetupScreen } from '@/features/profile/screens/ProfileEditorScreens'

describe('app/setup route', () => {
  it('re-exports the profile setup screen', () => {
    expect(SetupRoute).toBe(ProfileSetupScreen)
  })
})
