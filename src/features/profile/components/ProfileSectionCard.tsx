import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { ChevronRight } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'
import { SeparatedStack, SurfaceCard } from '@/components/ui'
import type { Tone } from '@/components/ui'

export type ProfileSectionPreviewRow = {
  label: string
  value: string
}

export type ProfileSectionCardProps = {
  decorativeAccent?: boolean
  leading?: ReactNode
  onPress: () => void
  previewRows: ProfileSectionPreviewRow[]
  title: string
  tone?: Tone
}

export function ProfileSectionCard({
  decorativeAccent = false,
  leading,
  onPress,
  previewRows,
  title,
  tone = 'neutral',
}: ProfileSectionCardProps) {
  const { fontScale, width } = useWindowDimensions()
  const isCompactWidth = width < 360
  const prefersStackedRows = isCompactWidth || fontScale > 1.15
  const accessibilityLabel = [title, previewRows[0]?.value]
    .filter(Boolean)
    .join('. ')
  const accessibilityHint = previewRows
    .map((row) => `${row.label}: ${row.value}`)
    .join('. ')

  return (
    <SurfaceCard
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      decorativeAccent={decorativeAccent}
      gap="$3"
      onPress={onPress}
      pressStyle={{ opacity: 0.92, scale: 0.99 }}
      tone={tone}
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
            {prefersStackedRows ? (
              <YStack gap="$1.5" py="$2.5">
                <Text
                  color={index < 2 ? '$color10' : '$color11'}
                  fontSize={14}
                  fontWeight="700"
                >
                  {row.label}
                </Text>
                <Text
                  color="$color"
                  fontSize={index < 2 ? 16 : 15}
                  fontWeight={index < 2 ? '700' : '600'}
                >
                  {row.value}
                </Text>
              </YStack>
            ) : (
              <XStack gap="$3" items="center" justify="space-between" py="$2.5">
                <Text
                  color={index < 2 ? '$color10' : '$color11'}
                  fontSize={14}
                  fontWeight="700"
                >
                  {row.label}
                </Text>
                <Text
                  color="$color"
                  flex={1}
                  fontSize={index < 2 ? 16 : 15}
                  fontWeight={index < 2 ? '700' : '600'}
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
