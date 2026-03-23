export type OnboardingSlideIconKey = 'barcode' | 'map' | 'returns' | 'wallet'
export type OnboardingSlideId = 'machine' | 'map' | 'purpose' | 'wallet'

export type OnboardingSlide = {
  detail: string
  eyebrow: string
  description: string
  iconKey: OnboardingSlideIconKey
  id: OnboardingSlideId
  title: string
}
