import type { ReactNode } from 'react'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'
import { SeparatedStack, SurfaceCard } from '@/components/ui'

export type ProfileMenuRow = {
  helper?: string
  icon: ReactNode
  onPress: () => void
  summary: ReactNode
  title: string
}

export type ProfileMenuCardProps = {
  rows: ProfileMenuRow[]
}

function renderSummary(summary: ReactNode) {
  if (typeof summary === 'string' || typeof summary === 'number') {
    return (
      <Text
        color="$color"
        fontSize={16}
        fontWeight="800"
        style={{ flexShrink: 1 }}
      >
        {summary}
      </Text>
    )
  }

  return summary
}

export function ProfileMenuCard({ rows }: ProfileMenuCardProps) {
  return (
    <SurfaceCard p={0}>
      <SeparatedStack separatorSpacing="$2">
        {rows.map((row, index) => (
          <YStack key={`${row.title}-${index}`}>
            <XStack
              accessibilityLabel={row.title}
              accessibilityRole="button"
              gap="$3"
              items="center"
              onPress={row.onPress}
              pressStyle={{ opacity: 0.9 }}
              px="$4"
              py="$3.5"
            >
              <XStack
                bg="$accent3"
                height={44}
                items="center"
                justify="center"
                rounded={22}
                width={44}
              >
                {row.icon}
              </XStack>

              <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
                <Text color="$color10" fontSize={13} fontWeight="700">
                  {row.title}
                </Text>
                {renderSummary(row.summary)}
                {row.helper ? (
                  <Text color="$color11" fontSize={14}>
                    {row.helper}
                  </Text>
                ) : null}
              </YStack>

              <ChevronRight color="$color10" size={18} />
            </XStack>
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}
