import NotFoundRoute from '@/app/+not-found'
import NotFoundScreen from '@/features/app-shell/screens/NotFoundScreen'

describe('app/+not-found route', () => {
  it('re-exports the not found screen', () => {
    expect(NotFoundRoute).toBe(NotFoundScreen)
  })
})
