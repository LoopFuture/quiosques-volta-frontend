import { ArrowUpRight, Check, X } from '@tamagui/lucide-icons'
import { Text, YStack } from 'tamagui'
import { SurfaceCard } from '@/components/ui'
import type { Tone } from '@/components/ui/types'
import type { WalletTransactionStatus } from '../models'

type WalletMovementSummaryCardProps = {
  amount: string
  description: string
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
  status,
  title,
  tone,
}: WalletMovementSummaryCardProps) {
  const Icon = getMovementStatusIcon(status)

  return (
    <SurfaceCard items="center" gap="$4.5" p="$5" tone={tone}>
      <YStack items="center" justify="center">
        <YStack
          bg="$accent3"
          borderColor="$accent6"
          borderWidth={1}
          height={76}
          items="center"
          justify="center"
          rounded={38}
          width={76}
        >
          <Icon color="$accent11" size={34} />
        </YStack>
      </YStack>

      <YStack items="center" gap="$2" style={{ maxWidth: 320 }}>
        <Text
          fontSize={38}
          fontWeight="900"
          lineHeight={44}
          numberOfLines={2}
          style={{ textAlign: 'center' }}
        >
          {amount}
        </Text>
        <Text
          accessibilityRole="header"
          fontSize={24}
          fontWeight="800"
          style={{ textAlign: 'center' }}
        >
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
