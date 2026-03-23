import type { ReactNode } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { StatusBadge, SurfaceCard } from '@/components/ui'

type WalletPayoutMethodCardProps = {
  badgeLabel?: string
  description: string
  disabled?: boolean
  icon?: ReactNode
  onPress?: () => void
  selected: boolean
  testID?: string
  title: string
}

export function WalletPayoutMethodCard({
  badgeLabel,
  description,
  disabled = false,
  icon,
  onPress,
  selected,
  testID,
  title,
}: WalletPayoutMethodCardProps) {
  return (
    <Button
      accessibilityRole="radio"
      accessibilityState={{
        disabled,
        selected,
      }}
      disabled={disabled}
      onPress={onPress}
      pressStyle={
        disabled
          ? undefined
          : {
              opacity: 0.96,
              scale: 0.99,
            }
      }
      testID={testID}
      unstyled
    >
      <SurfaceCard
        bg={selected ? '$accent1' : disabled ? '$color2' : '$background'}
        borderColor={selected ? '$accent8' : disabled ? '$color6' : '$color7'}
        borderWidth={selected ? 2 : 1}
        gap="$3"
        p="$4"
        rounded={30}
        style={{ opacity: disabled ? 0.9 : 1 }}
      >
        <XStack items="center" justify="space-between" gap="$3">
          <XStack flex={1} gap="$3" items="center" style={{ minWidth: 0 }}>
            <YStack
              borderColor={
                selected ? '$accent8' : disabled ? '$color8' : '$color9'
              }
              borderWidth={2}
              height={24}
              items="center"
              justify="center"
              rounded={12}
              width={24}
            >
              {selected ? (
                <YStack bg="$accent9" height={10} rounded={999} width={10} />
              ) : null}
            </YStack>

            <YStack flex={1} gap="$1.5" style={{ minWidth: 0 }}>
              <XStack gap="$2" items="center" style={{ minWidth: 0 }}>
                <Text
                  color="$color"
                  fontSize={16}
                  fontWeight="800"
                  style={{ flexShrink: 1 }}
                >
                  {title}
                </Text>
                {badgeLabel ? (
                  <StatusBadge tone={disabled ? 'neutral' : 'accent'}>
                    {badgeLabel}
                  </StatusBadge>
                ) : null}
              </XStack>
              <Text color={disabled ? '$color10' : '$color11'} fontSize={14}>
                {description}
              </Text>
            </YStack>
          </XStack>

          {icon ? (
            <YStack
              bg={selected ? '$accent2' : '$color3'}
              borderColor={selected ? '$accent7' : '$color6'}
              borderWidth={1}
              height={40}
              items="center"
              justify="center"
              rounded={20}
              width={40}
            >
              {icon}
            </YStack>
          ) : null}
        </XStack>
      </SurfaceCard>
    </Button>
  )
}
