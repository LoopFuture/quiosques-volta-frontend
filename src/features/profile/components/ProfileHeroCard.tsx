import { useWindowDimensions } from 'react-native'
import { Text, YStack } from 'tamagui'
import { SurfaceCard } from '@/components/ui'

type ProfileHeroCardProps = {
  headlineLabel: string
  headlineValue: string
  supportingText: string
  title: string
}

export function ProfileHeroCard({
  headlineLabel,
  headlineValue,
  supportingText,
  title,
}: ProfileHeroCardProps) {
  const { fontScale, width } = useWindowDimensions()
  const prefersExpandedLayout = width < 360 || fontScale > 1.15

  return (
    <SurfaceCard gap="$4" p="$5" tone="accent">
      <YStack gap="$2">
        <Text
          color="$accent11"
          fontSize={13}
          fontWeight="800"
          textTransform="uppercase"
        >
          {title}
        </Text>
        <Text color="$color11" fontSize={14}>
          {supportingText}
        </Text>
      </YStack>

      <YStack borderColor="$borderColor" borderTopWidth={1} gap="$1.5" pt="$4">
        <Text color="$color10" fontSize={14} fontWeight="700">
          {headlineLabel}
        </Text>
        <Text
          color="$color"
          fontSize={prefersExpandedLayout ? 32 : 36}
          fontWeight="900"
          lineHeight={prefersExpandedLayout ? 38 : 42}
          numberOfLines={prefersExpandedLayout ? undefined : 2}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {headlineValue}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}
