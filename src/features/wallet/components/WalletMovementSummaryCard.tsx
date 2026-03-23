import { ArrowUpRight, Check, X } from '@tamagui/lucide-icons'
import { Text, YStack } from 'tamagui'
import { StatusBadge, SurfaceCard } from '@/components/ui'
import type { Tone } from '@/components/ui/types'
import type { WalletTransactionStatus } from '../models'

type WalletMovementSummaryCardProps = {
  amount: string
  description: string
  stateLabel: string
  status: WalletTransactionStatus
  title: string
  tone: Tone
}

function getMovementStatusIcon(status: WalletTransactionStatus) {
  if (status === 'failed' || status === 'cancelled') {
    return X
  }

  if (status === 'pending' || status === 'processing') {
    return ArrowUpRight
  }

  return Check
}

export function WalletMovementSummaryCard({
  amount,
  description,
  stateLabel,
  status,
  title,
  tone,
}: WalletMovementSummaryCardProps) {
  const Icon = getMovementStatusIcon(status)

  return (
    <SurfaceCard items="center" gap="$4.5" p="$5" tone={tone}>
      <YStack items="center" justify="center">
        <YStack
          pointerEvents="none"
          position="absolute"
          rounded={60}
          bg="$accent4"
          opacity={0.24}
          style={{ width: 120, height: 120 }}
        />
        <YStack
          bg="$accent2"
          borderColor="$accent7"
          borderWidth={1}
          height={84}
          items="center"
          justify="center"
          rounded={42}
          width={84}
        >
          <Icon color="$accent11" size={34} />
        </YStack>
      </YStack>

      <YStack items="center" gap="$2.5" style={{ maxWidth: 320 }}>
        <Text
          adjustsFontSizeToFit
          fontSize={42}
          fontWeight="900"
          minimumFontScale={0.82}
          numberOfLines={1}
        >
          {amount}
        </Text>
        <StatusBadge tone={tone}>{stateLabel}</StatusBadge>
        <Text fontSize={26} fontWeight="800" style={{ textAlign: 'center' }}>
          {title}
        </Text>
        <Text
          color="$color11"
          fontSize={15}
          lineHeight={22}
          style={{ textAlign: 'center' }}
        >
          {description}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}
