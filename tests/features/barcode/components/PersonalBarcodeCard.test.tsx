import { Text } from 'react-native'
import { PersonalBarcodeCard } from '@/features/barcode/components/PersonalBarcodeCard'
import { renderWithProvider } from '@tests/support/test-utils'

jest.mock('react-native-qrcode-svg', () => {
  const React = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')

  return function MockQRCode(props: { testID?: string }) {
    return <View testID={props.testID ?? 'mock-qr-code'} />
  }
})

describe('PersonalBarcodeCard', () => {
  it('renders barcode details with a custom qr node and no CTA button', () => {
    const view = renderWithProvider(
      <PersonalBarcodeCard
        barcode={<Text>QR customizado</Text>}
        code="VF-0001-RTM-2026"
        description="Apresenta a maquina para iniciar o pagamento."
        title="O teu barcode pessoal"
      />,
    )

    expect(view.getByText('O teu barcode pessoal')).toBeTruthy()
    expect(view.getByText('QR customizado')).toBeTruthy()
    expect(view.getByText('VF-0001-RTM-2026')).toBeTruthy()
    expect(view.queryByText('Joao Ferreira')).toBeNull()
    expect(view.queryByText('SPIN ativo')).toBeNull()
    expect(view.queryByText('IBAN para reembolso')).toBeNull()
    expect(view.queryByText('PT50 0035 0000 0000 0000 1')).toBeNull()
    expect(view.queryByText('Escanear codigo')).toBeNull()
  })
})
