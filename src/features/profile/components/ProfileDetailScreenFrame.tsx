import { useTranslation } from 'react-i18next'
import type { DetailScreenFrameProps } from '@/components/ui'
import { DetailScreenFrame } from '@/components/ui'

type ProfileDetailScreenFrameProps = Omit<DetailScreenFrameProps, 'backLabel'>

export function ProfileDetailScreenFrame({
  ...props
}: ProfileDetailScreenFrameProps) {
  const { t } = useTranslation()

  return (
    <DetailScreenFrame
      {...props}
      backLabel={t('tabScreens.profile.common.backLabel')}
      keyboardAware
    />
  )
}
