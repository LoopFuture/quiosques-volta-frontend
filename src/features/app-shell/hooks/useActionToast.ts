import { useToastController } from '@tamagui/toast'
import { getAppToastDuration } from '../toast'

export function useActionToast() {
  const toast = useToastController()

  return {
    showError(title: string, message: string) {
      toast.show(title, {
        duration: getAppToastDuration('error'),
        message,
        variant: 'error',
      })
    },
    showSuccess(title: string, message: string) {
      toast.show(title, {
        duration: getAppToastDuration('success'),
        message,
        variant: 'success',
      })
    },
  }
}
