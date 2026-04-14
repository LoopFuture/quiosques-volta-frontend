import { Text, YStack, XStack } from 'tamagui'
import { SeparatedStack, SurfaceCard } from '@/components/ui'
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
        <Text color="$color11" fontSize={14}>
          {supportingText}
        </Text>
      </YStack>

      <YStack borderColor="$borderColor" borderTopWidth={1} pt="$4">
        <SeparatedStack separatorSpacing="$2">
          <YStack gap="$1">
            <XStack items="center" justify="space-between" gap="$3">
              <Text color="$color10" fontSize={14} fontWeight="700">
                {headlineLabel}
              </Text>
              <Text color="$color" fontSize={28} fontWeight="900">
                {headlineValue}
              </Text>
            </XStack>
          </YStack>

          {detailStats?.map((stat) => (
            <YStack key={stat.label} gap="$1">
              <XStack items="center" justify="space-between" gap="$3">
                <Text color="$color10" fontSize={13} fontWeight="700">
                  {stat.label}
                </Text>
                <Text color="$color" fontSize={18} fontWeight="800">
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
        </SeparatedStack>
      </YStack>
    </SurfaceCard>
  )
}
