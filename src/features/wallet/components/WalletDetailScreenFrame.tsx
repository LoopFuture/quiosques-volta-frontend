import { useTranslation } from 'react-i18next'
import type { DetailScreenFrameProps } from '@/components/ui'
import { DetailScreenFrame } from '@/components/ui'

type WalletDetailScreenFrameProps = Omit<DetailScreenFrameProps, 'backLabel'>

export function WalletDetailScreenFrame({
  ...props
}: WalletDetailScreenFrameProps) {
  const { t } = useTranslation()

  return (
    <DetailScreenFrame
      {...props}
      backLabel={t('tabScreens.wallet.common.backLabel')}
    />
  )
}
