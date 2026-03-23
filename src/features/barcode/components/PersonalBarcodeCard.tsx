import type { ReactNode } from 'react'
import { Text, YStack } from 'tamagui'
import { SurfaceCard } from '@/components/ui'
import { BarcodeQrCode } from './BarcodeQrCode'

export type PersonalBarcodeCardProps = {
  action?: ReactNode
  barcode?: ReactNode
  description?: string
  eyebrow?: ReactNode
  footer?: ReactNode
  reference: string
  referenceDisplay?: ReactNode
  title: string
}

export function PersonalBarcodeCard({
  action,
  barcode,
  description,
  eyebrow,
  footer,
  reference,
  referenceDisplay,
  title,
}: PersonalBarcodeCardProps) {
  const resolvedReferenceDisplay =
    referenceDisplay === undefined ? (
      <Text
        color="$color12"
        fontSize={26}
        fontWeight="800"
        letterSpacing={1}
        style={{ textAlign: 'center' }}
      >
        {reference}
      </Text>
    ) : (
      referenceDisplay
    )

  return (
    <SurfaceCard gap="$4.5" px="$5" pt="$5" pb="$5">
      <YStack gap="$2.5" items="flex-start">
        {eyebrow}
        <Text fontSize={34} fontWeight="900" lineHeight={38}>
          {title}
        </Text>
        {description ? (
          <Text color="$color11" fontSize={16} lineHeight={22}>
            {description}
          </Text>
        ) : null}
      </YStack>

      <YStack gap="$4" items="center" width="100%">
        <YStack gap="$3.5" items="center" width="100%">
          {barcode ?? <BarcodeQrCode size={168} value={reference} />}
        </YStack>

        {resolvedReferenceDisplay !== null ? (
          <YStack gap="$1.5" items="center" width="100%">
            {resolvedReferenceDisplay}
          </YStack>
        ) : null}

        {action ? <YStack width="100%">{action}</YStack> : null}

        {footer ? (
          <YStack items="center" width="100%">
            {footer}
          </YStack>
        ) : null}
      </YStack>
    </SurfaceCard>
  )
}
