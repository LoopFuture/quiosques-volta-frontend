import WalletTransferRoute from '@/app/wallet/transfer'
import WalletTransferScreen from '@/features/wallet/screens/WalletTransferScreen'

describe('app/wallet/transfer route', () => {
  it('re-exports the wallet transfer screen', () => {
    expect(WalletTransferRoute).toBe(WalletTransferScreen)
  })
})
