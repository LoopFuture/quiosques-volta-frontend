import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'

export default function ProfileHelpScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <OnboardingScreen
      backLabel={t('tabScreens.profile.common.backLabel')}
      onBackPress={() => router.back()}
      onComplete={() => router.back()}
      title={t('tabScreens.profile.hub.helpRowLabel')}
      variant="review"
    />
  )
}
