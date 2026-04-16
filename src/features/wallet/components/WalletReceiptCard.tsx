import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import {
  SeparatedStack,
  SurfaceCard,
  SurfaceSeparator,
  ToneScope,
  type DetailItem,
} from '@/components/ui'
import type { Tone } from '@/components/ui/types'

type WalletReceiptCardProps = {
  footer?: ReactNode
  items: DetailItem[]
  testID?: string
  title: string
}

function renderValue(
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
          fontWeight="800"
          style={{ flexShrink: 1, textAlign: align }}
        >
          {value}
        </Text>
      </ToneScope>
    )
  }

  return value
}

export function WalletReceiptCard({
  footer,
  items,
  testID,
  title,
}: WalletReceiptCardProps) {
  const { fontScale, width } = useWindowDimensions()
  const isCompactWidth = width < 360 || fontScale > 1.15

  return (
    <SurfaceCard gap="$3.5" p="$4.5" testID={testID}>
      <Text
        accessibilityRole="header"
        color="$color10"
        fontSize={13}
        fontWeight="800"
        textTransform="uppercase"
      >
        {title}
      </Text>

      <SeparatedStack separatorSpacing="$0">
        {items.map((item, index) =>
          isCompactWidth ? (
            <YStack
              key={`${item.label}-${index}`}
              gap="$1.5"
              py="$2.5"
              style={{ minWidth: 0 }}
            >
              <YStack gap="$1">
                <Text color="$color10" fontSize={14} fontWeight="700">
                  {item.label}
                </Text>
                {item.helper ? (
                  <Text color="$color11" fontSize={13}>
                    {item.helper}
                  </Text>
                ) : null}
              </YStack>
              {renderValue(item.value, item.tone, 'left')}
            </YStack>
          ) : (
            <XStack
              key={`${item.label}-${index}`}
              gap="$3"
              items="center"
              justify="space-between"
              py="$2.5"
            >
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
                {renderValue(item.value, item.tone)}
              </XStack>
            </XStack>
          ),
        )}
      </SeparatedStack>

      {footer ? (
        <YStack gap="$3">
          <SurfaceSeparator />
          {footer}
        </YStack>
      ) : null}
    </SurfaceCard>
  )
}
