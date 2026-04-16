import { memo } from 'react'
import QRCode from 'react-native-qrcode-svg'
import { YStack, useThemeName } from 'tamagui'
import { qrPresentationColors } from '@/themes'

type BarcodeQrCodeProps = {
  size: number
  testID?: string
  value: string
}

function BarcodeQrCodeComponent({ size, testID, value }: BarcodeQrCodeProps) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')

  return (
    <YStack
      bg={isDarkTheme ? qrPresentationColors.background : '$accent2'}
      borderColor={isDarkTheme ? 'transparent' : '$accent7'}
      borderWidth={isDarkTheme ? 0 : 1.5}
      p="$3"
      rounded={24}
    >
      <QRCode
        backgroundColor={qrPresentationColors.background}
        color={qrPresentationColors.foreground}
        ecl="M"
        quietZone={16}
        size={size}
        testID={testID}
        value={value}
      />
    </YStack>
  )
}

export const BarcodeQrCode = memo(BarcodeQrCodeComponent)
