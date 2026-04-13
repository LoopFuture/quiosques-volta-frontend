import WalletMovementsRoute from '@/app/wallet/movements'
import WalletMovementsScreen from '@/features/wallet/screens/WalletMovementsScreen'

describe('app/wallet/movements route', () => {
  it('re-exports the wallet movements screen', () => {
    expect(WalletMovementsRoute).toBe(WalletMovementsScreen)
  })
})
