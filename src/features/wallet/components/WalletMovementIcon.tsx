import { ArrowUpRight, GlassWater, Milk, Recycle } from '@tamagui/lucide-icons'
import type { WalletTransactionType } from '../models'

const walletMovementIconMap = {
  adjustment: GlassWater,
  credit: Recycle,
  transfer_debit: ArrowUpRight,
} as const

export function WalletMovementIcon({ type }: { type: WalletTransactionType }) {
  const Icon = walletMovementIconMap[type] ?? Milk

  return <Icon color="$accent11" size={20} />
}
