import type { ReactNode } from 'react'
import { Text, XStack, YStack, useThemeName } from 'tamagui'
import { getPlatformShadowProps } from '@/components/ui/platformShadows'
import { getTabBarBackground } from '@/themes'

export type NavItem = {
  key: string
  label: string
  icon: ReactNode
  active?: boolean
  emphasis?: 'default' | 'center'
  accessibilityLabel?: string
  accessibilityRole?: 'button' | 'tab'
  accessibilityState?: {
    selected?: boolean
  }
  onLongPress?: () => void
  onPress?: () => void
  testID?: string
}

export type BottomTabBarProps = {
  items: NavItem[]
}

const ACTIVE_LABEL_COLOR = '$accent10'
const CENTER_BUTTON_BACKGROUND = '$accent9'
const CENTER_BUTTON_BORDER = '$background'
const INACTIVE_LABEL_COLOR = '$color'

export function BottomTabBar({ items }: BottomTabBarProps) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const barBackground = getTabBarBackground(themeName)

  return (
    <YStack bg={barBackground} overflow="visible" px={8}>
      <XStack items="center" justify="space-between" overflow="visible">
        {items.map((item) => {
          const active = Boolean(item.active)
          const emphasis = item.emphasis === 'center'
          const labelColor = active ? ACTIVE_LABEL_COLOR : INACTIVE_LABEL_COLOR

          return (
            <YStack
              key={item.key}
              accessibilityLabel={item.accessibilityLabel ?? item.label}
              accessibilityRole={item.accessibilityRole}
              accessibilityState={item.accessibilityState}
              flex={1}
              gap={6}
              height={emphasis ? 92 : 62}
              items="center"
              justify="flex-end"
              onLongPress={item.onLongPress}
              onPress={item.onPress}
              pressStyle={item.onPress ? { opacity: 0.88 } : undefined}
              testID={item.testID}
              style={
                emphasis ? { transform: [{ translateY: -36 }] } : undefined
              }
            >
              <YStack
                height={emphasis ? 78 : 28}
                items="center"
                justify={emphasis ? 'center' : 'flex-end'}
                width="100%"
              >
                {emphasis ? (
                  <YStack
                    bg={CENTER_BUTTON_BACKGROUND}
                    borderColor={CENTER_BUTTON_BORDER}
                    borderWidth={6}
                    height={78}
                    items="center"
                    justify="center"
                    rounded={39}
                    width={78}
                    {...getPlatformShadowProps('fab', isDarkTheme)}
                  >
                    {item.icon}
                  </YStack>
                ) : (
                  <YStack
                    height={28}
                    items="center"
                    justify="center"
                    width={28}
                  >
                    {item.icon}
                  </YStack>
                )}
              </YStack>

              {emphasis ? null : (
                <Text
                  color={labelColor}
                  fontSize={11}
                  fontWeight={active ? '800' : '700'}
                  letterSpacing={1.1}
                  opacity={active ? 1 : 0.88}
                  style={{ textAlign: 'center' }}
                  textTransform="uppercase"
                >
                  {item.label}
                </Text>
              )}
            </YStack>
          )
        })}
      </XStack>
    </YStack>
  )
}
