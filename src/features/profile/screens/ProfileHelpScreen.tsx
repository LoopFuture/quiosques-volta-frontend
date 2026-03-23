import { useRouter } from 'expo-router'
import OnboardingScreen from '@/features/onboarding/screens/OnboardingScreen'

export default function ProfileHelpScreen() {
  const router = useRouter()

  return <OnboardingScreen onComplete={() => router.back()} />
}
