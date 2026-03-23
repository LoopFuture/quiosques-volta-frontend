import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { SeparatedStack } from './SeparatedStack'
import { SurfaceCard } from './SurfaceCard'
import { ToneScope } from './tone'
import type { DetailItem, Tone } from './types'

export type DetailCardProps = {
  footer?: ReactNode
  items: DetailItem[]
  title?: string
}

function renderTextValue(
  value: ReactNode,
  tone: Tone = 'neutral',
  align: 'left' | 'right' = 'right',
) {
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <ToneScope tone={tone}>
        <Text
          color="$color"
          fontSize={15}
          fontWeight="700"
          style={{ textAlign: align }}
        >
          {value}
        </Text>
      </ToneScope>
    )
  }

  return value
}

export function DetailCard({ footer, items, title }: DetailCardProps) {
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360

  return (
    <SurfaceCard>
      {title ? (
        <Text
          color="$color10"
          fontSize={14}
          fontWeight="700"
          textTransform="uppercase"
        >
          {title}
        </Text>
      ) : null}

      <SeparatedStack>
        {items.map((item, index) => (
          <YStack key={`${item.label}-${index}`}>
            {isCompactWidth ? (
              <YStack gap="$1.5" py="$3">
                <YStack gap="$1" style={{ minWidth: 0 }}>
                  <Text color="$color10" fontSize={14} fontWeight="700">
                    {item.label}
                  </Text>
                  {item.helper ? (
                    <Text color="$color11" fontSize={13}>
                      {item.helper}
                    </Text>
                  ) : null}
                </YStack>
                {renderTextValue(item.value, item.tone, 'left')}
              </YStack>
            ) : (
              <XStack gap="$3" items="center" justify="space-between" py="$3">
                <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
                  <Text color="$color10" fontSize={14} fontWeight="700">
                    {item.label}
                  </Text>
                  {item.helper ? (
                    <Text color="$color11" fontSize={13}>
                      {item.helper}
                    </Text>
                  ) : null}
                </YStack>
                <XStack flex={1} justify="flex-end" style={{ minWidth: 0 }}>
                  {renderTextValue(item.value, item.tone)}
                </XStack>
              </XStack>
            )}
          </YStack>
        ))}
      </SeparatedStack>

      {footer}
    </SurfaceCard>
  )
}
