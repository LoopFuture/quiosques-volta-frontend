import { useTranslation } from 'react-i18next'
import { Text, YStack } from 'tamagui'
import { PrimaryButton } from './PrimaryButton'
import { SurfaceCard } from './SurfaceCard'

type QueryErrorStateProps = {
  description?: string
  onRetry: () => void
  recoveryHint?: string
  retryLabel?: string
  testID?: string
  title?: string
}

export function QueryErrorState({
  description,
  onRetry,
  recoveryHint,
  retryLabel,
  testID,
  title,
}: QueryErrorStateProps) {
  const { t } = useTranslation()

  return (
    <SurfaceCard items="center" p="$5" testID={testID} tone="error">
      <YStack gap="$3" items="center">
        <YStack gap="$2" items="center">
          <Text
            color="$accent11"
            fontSize={13}
            fontWeight="800"
            textTransform="uppercase"
          >
            {title ?? t('routes.queryError.title')}
          </Text>
          <Text fontSize={20} fontWeight="800" style={{ textAlign: 'center' }}>
            {description ?? t('routes.queryError.description')}
          </Text>
          <Text color="$color11" fontSize={14} style={{ textAlign: 'center' }}>
            {recoveryHint ?? t('routes.queryError.recoveryHint')}
          </Text>
        </YStack>

        <PrimaryButton
          emphasis="outline"
          fullWidth={false}
          tone="error"
          onPress={onRetry}
        >
          {retryLabel ?? t('routes.queryError.retryLabel')}
        </PrimaryButton>
      </YStack>
    </SurfaceCard>
  )
}
