import QRCode from 'react-native-qrcode-svg'
import { YStack, useThemeName } from 'tamagui'
import { brandBlack, brandWhite } from '@/themes'

type BarcodeQrCodeProps = {
  size: number
  testID?: string
  value: string
}

export function BarcodeQrCode({ size, testID, value }: BarcodeQrCodeProps) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')

  return (
    <YStack
      bg={isDarkTheme ? brandWhite : '$accent2'}
      borderColor={isDarkTheme ? 'transparent' : '$accent7'}
      borderWidth={isDarkTheme ? 0 : 1.5}
      p="$3"
      rounded={24}
    >
      <QRCode
        backgroundColor={brandWhite}
        color={brandBlack}
        ecl="M"
        quietZone={16}
        size={size}
        testID={testID}
        value={value}
      />
    </YStack>
  )
}
