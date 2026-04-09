import {
  invalidateBarcodeQueries,
  invalidateHomeQueries,
  invalidateProfileQueries,
  invalidateWalletQueries,
} from '@/features/app-data/query/invalidation'
import { appQueryKeys } from '@/features/app-data/query/keys'

describe('query invalidation helpers', () => {
  const queryClient = {
    invalidateQueries: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('invalidates the home query family', async () => {
    await invalidateHomeQueries(queryClient as any)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: appQueryKeys.home.all,
    })
  })

  it('invalidates the barcode, wallet, and profile query families', async () => {
    await invalidateBarcodeQueries(queryClient as any)
    await invalidateWalletQueries(queryClient as any)
    await invalidateProfileQueries(queryClient as any)

    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: appQueryKeys.barcode.all,
    })
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: appQueryKeys.wallet.all,
    })
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: appQueryKeys.profile.all,
    })
  })
})
