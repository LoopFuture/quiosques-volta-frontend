import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { SeparatedStack, SurfaceCard } from '@/components/ui'
import type { ProfileSummaryStat } from '../models'

type ProfileSummaryTotalsCardProps = {
  description: string
  stats: ProfileSummaryStat[]
  title: string
}

export function ProfileSummaryTotalsCard({
  description,
  stats,
  title,
}: ProfileSummaryTotalsCardProps) {
  const { fontScale, width } = useWindowDimensions()
  const prefersStackedRows = width < 360 || fontScale > 1.15

  return (
    <SurfaceCard gap="$3.5" p="$4.5">
      <YStack gap="$1.5">
        <Text
          accessibilityRole="header"
          fontSize={18}
          fontWeight="800"
          lineHeight={23}
        >
          {title}
        </Text>
        <Text color="$color11" fontSize={15} lineHeight={21}>
          {description}
        </Text>
      </YStack>

      <SeparatedStack separatorSpacing="$2">
        {stats.map((stat, index) => (
          <YStack key={`${stat.label}-${index}`}>
            {prefersStackedRows ? (
              <YStack gap="$1.5" py="$2.5">
                <Text color="$color10" fontSize={14} fontWeight="700">
                  {stat.label}
                </Text>
                <Text color="$color" fontSize={17} fontWeight="800">
                  {stat.value}
                </Text>
                {stat.helper ? (
                  <Text color="$color11" fontSize={13} lineHeight={18}>
                    {stat.helper}
                  </Text>
                ) : null}
              </YStack>
            ) : (
              <YStack gap="$1" py="$2.5">
                <XStack gap="$3" items="center" justify="space-between">
                  <Text color="$color10" fontSize={14} fontWeight="700">
                    {stat.label}
                  </Text>
                  <Text
                    color="$color"
                    flex={1}
                    fontSize={17}
                    fontWeight="800"
                    style={{ textAlign: 'right' }}
                  >
                    {stat.value}
                  </Text>
                </XStack>
                {stat.helper ? (
                  <Text color="$color11" fontSize={13} lineHeight={18}>
                    {stat.helper}
                  </Text>
                ) : null}
              </YStack>
            )}
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}
