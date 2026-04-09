import BarcodeRoute from '@/app/(tabs)/barcode'
import BarcodeScreen from '@/features/barcode/screens/BarcodeScreen'

describe('app/(tabs)/barcode route', () => {
  it('re-exports the barcode feature screen', () => {
    expect(BarcodeRoute).toBe(BarcodeScreen)
  })
})
