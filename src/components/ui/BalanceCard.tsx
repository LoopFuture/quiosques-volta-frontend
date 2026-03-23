import type { ReactNode } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, YStack } from 'tamagui'
import type { Tone } from './types'
import { PrimaryButton } from './PrimaryButton'
import { SurfaceCard } from './SurfaceCard'

export type BalanceCardProps = {
  actionLabel?: string
  amount: string
  caption?: string
  eyebrow?: string
  footer?: ReactNode
  onActionPress?: () => void
  title?: string
  tone?: Tone
}

export function BalanceCard({
  actionLabel,
  amount,
  caption,
  eyebrow,
  footer,
  onActionPress,
  title,
  tone = 'accent',
}: BalanceCardProps) {
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360

  return (
    <SurfaceCard gap="$4" p="$5" tone={tone}>
      <YStack gap="$1.5" style={{ minWidth: 0 }}>
        {eyebrow ? (
          <Text
            color="$color10"
            fontSize={13}
            fontWeight="700"
            textTransform="uppercase"
          >
            {eyebrow}
          </Text>
        ) : null}
        {title ? (
          <Text
            color="$color"
            fontSize={18}
            fontWeight="700"
            style={{ flexShrink: 1 }}
          >
            {title}
          </Text>
        ) : null}
        {caption ? (
          <Text color="$color11" fontSize={14} style={{ flexShrink: 1 }}>
            {caption}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$2" style={{ minWidth: 0 }}>
        <Text
          adjustsFontSizeToFit
          color="$color"
          fontSize={isCompactWidth ? 38 : 44}
          fontWeight="900"
          minimumFontScale={0.85}
          numberOfLines={1}
        >
          {amount}
        </Text>
        {footer}
      </YStack>

      {actionLabel ? (
        <PrimaryButton onPress={onActionPress}>{actionLabel}</PrimaryButton>
      ) : null}
    </SurfaceCard>
  )
}
