import WalletRoute from '@/app/(tabs)/wallet'
import WalletScreen from '@/features/wallet/screens/WalletScreen'

describe('app/(tabs)/wallet route', () => {
  it('re-exports the wallet feature screen', () => {
    expect(WalletRoute).toBe(WalletScreen)
  })
})
