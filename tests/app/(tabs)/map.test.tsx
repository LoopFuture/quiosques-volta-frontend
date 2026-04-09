import MapRoute from '@/app/(tabs)/map'
import MapScreen from '@/features/map/screens/MapScreen'

describe('app/(tabs)/map route', () => {
  it('re-exports the map feature screen', () => {
    expect(MapRoute).toBe(MapScreen)
  })
})
