import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export type SectionBlockProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function SectionBlock({
  title,
  description,
  action,
  children,
}: SectionBlockProps) {
  const { width } = useWindowDimensions()
  const shouldStackHeader = Boolean(action) && width < 360

  return (
    <YStack gap="$3">
      {shouldStackHeader ? (
        <YStack gap="$2">
          <YStack flex={1} gap="$1.5" style={{ minWidth: 0 }}>
            <Text
              accessibilityRole="header"
              color="$color"
              fontSize={18}
              fontWeight="800"
            >
              {title}
            </Text>
            {description ? (
              <Text color="$color11" fontSize={15}>
                {description}
              </Text>
            ) : null}
          </YStack>
          {action}
        </YStack>
      ) : (
        <XStack items="center" justify="space-between" gap="$3">
          <YStack flex={1} gap="$1.5" style={{ minWidth: 0 }}>
            <Text
              accessibilityRole="header"
              color="$color"
              fontSize={18}
              fontWeight="800"
            >
              {title}
            </Text>
            {description ? (
              <Text color="$color11" fontSize={15}>
                {description}
              </Text>
            ) : null}
          </YStack>
          {action}
        </XStack>
      )}
      {children}
    </YStack>
  )
}
