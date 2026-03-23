import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'
import { SeparatedStack, SurfaceCard } from '@/components/ui'

export type ProfileSectionPreviewRow = {
  label: string
  value: string
}

export type ProfileSectionCardProps = {
  leading?: ReactNode
  onPress: () => void
  previewRows: ProfileSectionPreviewRow[]
  title: string
}

export function ProfileSectionCard({
  leading,
  onPress,
  previewRows,
  title,
}: ProfileSectionCardProps) {
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360

  return (
    <SurfaceCard
      accessibilityLabel={title}
      accessibilityRole="button"
      gap="$3"
      onPress={onPress}
      pressStyle={{ opacity: 0.92, scale: 0.99 }}
    >
      <XStack gap="$3" items="center">
        {leading ? (
          <XStack
            bg="$accent3"
            height={48}
            items="center"
            justify="center"
            rounded={24}
            width={48}
          >
            {leading}
          </XStack>
        ) : null}

        <Text flex={1} fontSize={18} fontWeight="800" style={{ minWidth: 0 }}>
          {title}
        </Text>

        <ChevronRight color="$color10" size={18} />
      </XStack>

      <SeparatedStack separatorSpacing="$2">
        {previewRows.map((row, index) => (
          <YStack key={`${row.label}-${index}`}>
            {isCompactWidth ? (
              <YStack gap="$1.5" py="$2.5">
                <Text color="$color10" fontSize={14} fontWeight="700">
                  {row.label}
                </Text>
                <Text color="$color" fontSize={16} fontWeight="700">
                  {row.value}
                </Text>
              </YStack>
            ) : (
              <XStack gap="$3" items="center" justify="space-between" py="$2.5">
                <Text color="$color10" fontSize={14} fontWeight="700">
                  {row.label}
                </Text>
                <Text
                  color="$color"
                  flex={1}
                  fontSize={16}
                  fontWeight="700"
                  style={{ textAlign: 'right' }}
                >
                  {row.value}
                </Text>
              </XStack>
            )}
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}
