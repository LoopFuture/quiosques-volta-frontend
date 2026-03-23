import { Text, XStack, YStack } from 'tamagui'
import { StatusBadge, SurfaceCard } from '@/components/ui'

type NotificationListItemProps = {
  message: string
  onPress: () => void
  read: boolean
  readA11yLabel: string
  title: string
  timeLabel: string
  unreadA11yLabel: string
  unreadBadgeLabel: string
}

export function NotificationListItem({
  message,
  onPress,
  read,
  readA11yLabel,
  title,
  timeLabel,
  unreadA11yLabel,
  unreadBadgeLabel,
}: NotificationListItemProps) {
  return (
    <SurfaceCard
      accessibilityLabel={`${title}, ${read ? readA11yLabel : unreadA11yLabel}`}
      accessibilityRole="button"
      bg={read ? '$background' : '$accent2'}
      borderColor={read ? undefined : '$accent7'}
      onPress={onPress}
      p="$4"
      pressStyle={{ opacity: 0.92, scale: 0.99 }}
      tone="neutral"
    >
      <YStack gap="$2.5" opacity={read ? 0.76 : 1}>
        <XStack gap="$2.5" items="center">
          <Text flex={1} fontSize={17} fontWeight={read ? '700' : '800'}>
            {title}
          </Text>
          {!read ? (
            <StatusBadge tone="accent">{unreadBadgeLabel}</StatusBadge>
          ) : null}
        </XStack>

        <Text color="$color11" fontSize={14} lineHeight={20}>
          {message}
        </Text>

        <Text color="$color10" fontSize={12} fontWeight="700">
          {timeLabel}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}
