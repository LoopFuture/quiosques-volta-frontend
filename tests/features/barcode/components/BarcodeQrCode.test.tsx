import { YStack } from 'tamagui'
import { BarcodeQrCode } from '@/features/barcode/components/BarcodeQrCode'
import { brandWhite } from '@/themes'
import { renderWithTheme } from '@tests/support/test-utils'

jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual('react-native')

  return function MockQrCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

describe('BarcodeQrCode', () => {
  it('uses the light theme surface styles', () => {
    const view = renderWithTheme(
      <BarcodeQrCode size={160} testID="barcode-qr-code" value="VF-0001" />,
      { defaultTheme: 'light' },
    )

    const wrapper = view.UNSAFE_getByType(YStack)

    expect(view.getByTestId('barcode-qr-code')).toBeTruthy()
    expect(wrapper.props.bg).toBe('$accent2')
    expect(wrapper.props.borderColor).toBe('$accent7')
    expect(wrapper.props.borderWidth).toBe(1.5)
  })

  it('uses the dark theme surface styles', () => {
    const view = renderWithTheme(
      <BarcodeQrCode
        size={160}
        testID="barcode-qr-code-dark"
        value="VF-0002"
      />,
      { defaultTheme: 'dark' },
    )

    const wrapper = view.UNSAFE_getByType(YStack)

    expect(view.getByTestId('barcode-qr-code-dark')).toBeTruthy()
    expect(wrapper.props.bg).toBe(brandWhite)
    expect(wrapper.props.borderColor).toBe('transparent')
    expect(wrapper.props.borderWidth).toBe(0)
  })
})
