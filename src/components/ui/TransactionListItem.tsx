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
  accessibilityHint?: string
  badgeLabel?: string
  badgeTone?: Tone
  framed?: boolean
  icon?: ReactNode
  onPress?: () => void
  subtitle?: string
  testID?: string
  title: string
}

export function TransactionListItem({
  amount,
  amountTone = 'accent',
  accessibilityHint,
  accessibilityLabel,
  badgeLabel,
  badgeTone = 'neutral',
  framed = true,
  icon,
  onPress,
  subtitle,
  testID,
  title,
}: TransactionListItemProps) {
  const { fontScale, width } = useWindowDimensions()
  const hasLongTitle = title.length > 32
  const hasLongSubtitle = (subtitle?.length ?? 0) > 28
  const hasLongBadgeLabel = (badgeLabel?.length ?? 0) > 18
  const hasVeryLongBadgeLabel = (badgeLabel?.length ?? 0) > 26
  const shouldUseStackedLayout =
    width < 420 ||
    fontScale > 1.05 ||
    hasLongTitle ||
    hasLongSubtitle ||
    hasVeryLongBadgeLabel

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
      items={shouldUseStackedLayout ? 'flex-start' : 'flex-end'}
      style={{
        flexShrink: 1,
        maxWidth: shouldUseStackedLayout ? '100%' : '50%',
        minWidth: 0,
        width: shouldUseStackedLayout ? '100%' : undefined,
      }}
    >
      <ToneScope tone={amountTone}>
        <Text
          color="$color"
          fontSize={shouldUseStackedLayout ? 22 : 24}
          fontWeight="900"
          lineHeight={shouldUseStackedLayout ? 27 : 29}
          style={{
            fontVariant: ['tabular-nums'],
            textAlign: shouldUseStackedLayout ? 'left' : 'right',
          }}
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
            px={hasVeryLongBadgeLabel ? '$1.5' : '$2'}
            py={hasLongBadgeLabel ? '$0.75' : '$1'}
            rounded={999}
            style={{
              alignSelf: shouldUseStackedLayout ? 'flex-start' : 'flex-end',
              maxWidth: '100%',
            }}
          >
            <Text
              color="$color"
              fontSize={hasLongBadgeLabel ? 11 : 12}
              fontWeight="800"
              lineHeight={hasLongBadgeLabel ? 15 : 16}
              numberOfLines={shouldUseStackedLayout ? undefined : 2}
              style={{ flexShrink: 1, textAlign: 'center' }}
            >
              {badgeLabel}
            </Text>
          </XStack>
        </ToneScope>
      ) : null}
    </YStack>
  )

  const content = shouldUseStackedLayout ? (
    <YStack gap="$3">
      <XStack gap="$3" items="flex-start">
        {iconNode}

        <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
          <Text
            color="$color"
            fontSize={17}
            fontWeight="800"
            lineHeight={22}
            numberOfLines={undefined}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              color="$color11"
              fontSize={15}
              lineHeight={20}
              numberOfLines={undefined}
            >
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
        <Text
          color="$color"
          fontSize={17}
          fontWeight="800"
          lineHeight={22}
          numberOfLines={fontScale > 1.15 ? 3 : 2}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            color="$color11"
            fontSize={15}
            lineHeight={20}
            numberOfLines={fontScale > 1.15 ? 3 : 2}
          >
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
        accessibilityHint={onPress ? accessibilityHint : undefined}
        accessibilityLabel={onPress ? (accessibilityLabel ?? title) : undefined}
        accessibilityRole={onPress ? 'button' : undefined}
        bg="$background"
        borderColor="$color8"
        borderWidth={1}
        onPress={onPress}
        p="$3.5"
        pressStyle={onPress ? { opacity: 0.92, scale: 0.99 } : undefined}
        rounded={24}
        testID={testID}
      >
        {content}
      </YStack>
    )
  }

  return (
    <SurfaceCard
      accessibilityHint={onPress ? accessibilityHint : undefined}
      accessibilityLabel={onPress ? (accessibilityLabel ?? title) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      p="$3.5"
      pressStyle={onPress ? { opacity: 0.92, scale: 0.99 } : undefined}
      testID={testID}
    >
      {content}
    </SurfaceCard>
  )
}
