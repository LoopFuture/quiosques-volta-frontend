import HomeRoute from '@/app/(tabs)/index'
import HomeScreen from '@/features/home/screens/HomeScreen'

describe('app/(tabs)/index route', () => {
  it('re-exports the home feature screen', () => {
    expect(HomeRoute).toBe(HomeScreen)
  })
})
