import { Tabs, router } from 'expo-router'
import { YStack, useThemeName } from 'tamagui'
import { BottomTabBar } from '@/features/app-shell/components/BottomTabBar'
import {
  mapTabNavItems,
  useAppTabDefinitions,
} from '@/features/app-shell/navigation/tab-nav'
import { getTabBarBackground } from '@/themes'

export default function TabLayout() {
  const appTabDefinitions = useAppTabDefinitions()
  const themeName = useThemeName()
  const tabBarBackground = getTabBarBackground(themeName)

  return (
    <Tabs
      tabBar={(props) => {
        const activeRouteName =
          props.state.routes[props.state.index]?.name ?? 'index'
        const baseNavItems = mapTabNavItems(appTabDefinitions, activeRouteName)
        const navItems = appTabDefinitions.map((item) => {
          const route = props.state.routes.find(
            (stateRoute) => stateRoute.name === item.routeName,
          )
          const isFocused = route?.name === activeRouteName

          return {
            ...baseNavItems.find((navItem) => navItem.key === item.key)!,
            accessibilityRole: 'tab' as const,
            accessibilityState: { selected: isFocused },
            onLongPress: route
              ? () => {
                  props.navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  })
                }
              : undefined,
            onPress: route
              ? () => {
                  const event = props.navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })

                  if (!isFocused && !event.defaultPrevented) {
                    router.navigate(item.href)
                  }
                }
              : undefined,
            testID: `tab-${item.routeName}`,
          }
        })

        return (
          <YStack bg={tabBarBackground} pb={Math.max(props.insets.bottom, 12)}>
            <BottomTabBar items={navItems} />
          </YStack>
        )
      }}
      screenOptions={{
        headerShown: false,
      }}
    >
      {appTabDefinitions.map((item) => (
        <Tabs.Screen
          key={item.routeName}
          name={item.routeName}
          options={{
            title: item.label,
          }}
        />
      ))}
    </Tabs>
  )
}
