import {
  mockBottomTabBar,
  mockRouterNavigate,
  mockTabs,
  mockTabsScreen,
  resetAppLayoutMocks,
} from '@tests/support/app-layout-mocks'
import { render } from '@testing-library/react-native'
import TabLayout from '@/app/(tabs)/_layout'

describe('app/(tabs)/_layout', () => {
  beforeEach(() => {
    resetAppLayoutMocks()
  })

  it('configures tabs, tab labels, and tab interactions', () => {
    render(<TabLayout />)

    const tabsProps = mockTabs.mock.calls[0][0]
    const screens = mockTabsScreen.mock.calls.map((call: [any]) => call[0])
    const emit = jest.fn(() => ({ defaultPrevented: false }))

    expect(tabsProps.screenOptions).toEqual({
      headerShown: false,
    })
    expect(screens.map((tab: { name: string }) => tab.name)).toEqual([
      'index',
      'map',
      'barcode',
      'wallet',
      'profile',
    ])
    expect(
      screens.map((tab: { options: { title: string } }) => tab.options.title),
    ).toEqual([
      'tabs.home.label',
      'tabs.map.label',
      'tabs.barcode.label',
      'tabs.wallet.label',
      'tabs.profile.label',
    ])

    render(
      tabsProps.tabBar({
        insets: { bottom: 20 },
        navigation: { emit },
        state: {
          index: 0,
          routes: [
            { key: 'index-key', name: 'index' },
            { key: 'map-key', name: 'map' },
            { key: 'barcode-key', name: 'barcode' },
            { key: 'wallet-key', name: 'wallet' },
            { key: 'profile-key', name: 'profile' },
          ],
        },
      }),
    )

    const navItems = mockBottomTabBar.mock.calls[0][0].items
    const homeItem = navItems.find(
      (item: { key: string }) => item.key === 'home',
    )
    const mapItem = navItems.find((item: { key: string }) => item.key === 'map')

    expect(navItems).toHaveLength(5)
    expect(homeItem).toBeDefined()
    expect(mapItem).toBeDefined()

    if (!homeItem || !mapItem) {
      throw new Error('Expected home and map tab items to be defined.')
    }

    expect(homeItem.accessibilityState).toEqual({ selected: true })
    expect(mapItem.accessibilityState).toEqual({ selected: false })

    homeItem.onPress()
    mapItem.onLongPress()
    mapItem.onPress()

    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      target: 'index-key',
      type: 'tabPress',
    })
    expect(emit).toHaveBeenCalledWith({
      target: 'map-key',
      type: 'tabLongPress',
    })
    expect(emit).toHaveBeenCalledWith({
      canPreventDefault: true,
      target: 'map-key',
      type: 'tabPress',
    })
    expect(mockRouterNavigate).toHaveBeenCalledWith('/map')
  })
})
