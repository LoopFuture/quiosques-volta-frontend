import { Text, YStack, XStack } from 'tamagui'
import { SurfaceCard } from '@/components/ui'
import type { ProfileSummaryStat } from '../models'

type ProfileHeroCardProps = {
  detailStats?: ProfileSummaryStat[]
  headlineLabel: string
  headlineValue: string
  supportingText: string
  title: string
}

export function ProfileHeroCard({
  detailStats,
  headlineLabel,
  headlineValue,
  supportingText,
  title,
}: ProfileHeroCardProps) {
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
        <Text fontSize={42} fontWeight="900">
          {headlineValue}
        </Text>
        <Text color="$color11" fontSize={15}>
          {headlineLabel}
        </Text>
        <Text color="$color11" fontSize={14}>
          {supportingText}
        </Text>
      </YStack>

      {detailStats ? (
        <YStack borderColor="$borderColor" borderTopWidth={1} gap="$3" pt="$4">
          {detailStats.map((stat) => (
            <YStack key={stat.label} gap="$1">
              <XStack items="center" justify="space-between" gap="$3">
                <Text color="$color10" fontSize={13} fontWeight="700">
                  {stat.label}
                </Text>
                <Text color="$color" fontSize={22} fontWeight="900">
                  {stat.value}
                </Text>
              </XStack>
              {stat.helper ? (
                <Text color="$color11" fontSize={12}>
                  {stat.helper}
                </Text>
              ) : null}
            </YStack>
          ))}
        </YStack>
      ) : null}
    </SurfaceCard>
  )
}
