import WalletMovementDetailRoute from '@/app/wallet/[movementId]'
import WalletMovementDetailScreen from '@/features/wallet/screens/WalletMovementDetailScreen'

describe('app/wallet/[movementId] route', () => {
  it('re-exports the wallet movement detail screen', () => {
    expect(WalletMovementDetailRoute).toBe(WalletMovementDetailScreen)
  })
})
