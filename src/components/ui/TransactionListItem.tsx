import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { SurfaceCard } from './SurfaceCard'
import { ToneScope } from './tone'
import type { Tone } from './types'

export type TransactionListItemProps = {
  amount: string
  amountTone?: Tone
  accessibilityLabel?: string
  badgeLabel?: string
  badgeTone?: Tone
  framed?: boolean
  icon?: ReactNode
  onPress?: () => void
  subtitle?: string
  title: string
}

export function TransactionListItem({
  amount,
  amountTone = 'accent',
  accessibilityLabel,
  badgeLabel,
  badgeTone = 'neutral',
  framed = true,
  icon,
  onPress,
  subtitle,
  title,
}: TransactionListItemProps) {
  const { width } = useWindowDimensions()
  const hasLongBadgeLabel = (badgeLabel?.length ?? 0) > 18
  const isCompactWidth = width < 360

  const iconNode = (
    <XStack
      bg="$accent3"
      height={48}
      items="center"
      justify="center"
      rounded={24}
      width={48}
    >
      {icon}
    </XStack>
  )

  const amountNode = (
    <YStack
      gap="$1.5"
      items={isCompactWidth ? 'flex-start' : 'flex-end'}
      style={{
        flexShrink: 1,
        maxWidth: isCompactWidth ? '100%' : '46%',
        minWidth: 0,
      }}
    >
      <ToneScope tone={amountTone}>
        <Text
          color="$color"
          fontSize={24}
          fontWeight="900"
          style={{ textAlign: isCompactWidth ? 'left' : 'right' }}
        >
          {amount}
        </Text>
      </ToneScope>
      {badgeLabel ? (
        <ToneScope tone={badgeTone}>
          <XStack
            bg="$background"
            borderColor="$borderColor"
            borderWidth={1}
            px={hasLongBadgeLabel ? '$1.5' : '$2'}
            py={hasLongBadgeLabel ? '$0.75' : '$1'}
            rounded={999}
          >
            <Text
              color="$color"
              fontSize={hasLongBadgeLabel ? 10 : 11}
              fontWeight="800"
            >
              {badgeLabel}
            </Text>
          </XStack>
        </ToneScope>
      ) : null}
    </YStack>
  )

  const content = isCompactWidth ? (
    <YStack gap="$3">
      <XStack gap="$3" items="flex-start">
        {iconNode}

        <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
          <Text color="$color" fontSize={17} fontWeight="800" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text color="$color11" fontSize={14} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      {amountNode}
    </YStack>
  ) : (
    <XStack gap="$3" items="center">
      {iconNode}

      <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
        <Text color="$color" fontSize={17} fontWeight="800" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text color="$color11" fontSize={14} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>

      {amountNode}
    </XStack>
  )

  if (!framed) {
    return (
      <YStack
        accessibilityLabel={onPress ? (accessibilityLabel ?? title) : undefined}
        accessibilityRole={onPress ? 'button' : undefined}
        bg="$background"
        borderColor="$color8"
        borderWidth={1}
        onPress={onPress}
        p="$3.5"
        pressStyle={onPress ? { opacity: 0.92, scale: 0.99 } : undefined}
        rounded={24}
      >
        {content}
      </YStack>
    )
  }

  return (
    <SurfaceCard
      accessibilityLabel={onPress ? (accessibilityLabel ?? title) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      p="$3.5"
      pressStyle={onPress ? { opacity: 0.92, scale: 0.99 } : undefined}
    >
      {content}
    </SurfaceCard>
  )
}
