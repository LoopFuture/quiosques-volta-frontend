import AuthRoute from '@/app/auth'
import AuthScreen from '@/features/auth/screens/AuthScreen'

describe('app/auth route', () => {
  it('re-exports the auth feature screen', () => {
    expect(AuthRoute).toBe(AuthScreen)
  })
})
