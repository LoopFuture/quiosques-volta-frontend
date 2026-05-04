import { Stack, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Text, YStack } from 'tamagui'
import { PrimaryButton, ScreenContainer } from '@/components/ui'
import { homeRoutes } from '@/features/home/routes'

export default function NotFoundScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const canGoBack = router.canGoBack()

  return (
    <>
      <Stack.Screen options={{ title: t('routes.notFound.title') }} />
      <ScreenContainer
        bottomInset
        contentProps={{ flex: 1, justify: 'center' }}
        decorativeBackground={false}
        testID="not-found-screen"
      >
        <YStack flex={1} gap="$8" justify="center">
          <YStack gap="$3" style={{ maxWidth: 440 }}>
            <Text color="$accent11" fontSize={18} fontWeight="900">
              {t('routes.notFound.title')}
            </Text>
            <Text fontSize={34} fontWeight="900" letterSpacing={-1.2}>
              {t('routes.notFound.message')}
            </Text>
            <Text color="$color11" fontSize={16} lineHeight={24}>
              {t('routes.notFound.description')}
            </Text>
          </YStack>

          <YStack gap="$3" style={{ maxWidth: 440 }}>
            <PrimaryButton
              onPress={() => router.replace(homeRoutes.index)}
              testID="not-found-home-button"
            >
              {t('routes.notFound.ctaLabel')}
            </PrimaryButton>

            {canGoBack ? (
              <PrimaryButton
                emphasis="outline"
                onPress={() => router.back()}
                testID="not-found-back-button"
                tone="neutral"
              >
                {t('routes.notFound.backLabel')}
              </PrimaryButton>
            ) : null}
          </YStack>
        </YStack>
      </ScreenContainer>
    </>
  )
}
