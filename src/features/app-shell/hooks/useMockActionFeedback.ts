import { useTranslation } from 'react-i18next'
import { useToastController } from '@tamagui/toast'
import { getAppToastDuration } from '../toast'

export function useMockActionFeedback() {
  const toast = useToastController()
  const { t } = useTranslation()

  return (actionLabel: string) => {
    toast.show(actionLabel, {
      duration: getAppToastDuration('mock'),
      message: t('mockAction.message'),
      variant: 'mock',
    })
  }
}
