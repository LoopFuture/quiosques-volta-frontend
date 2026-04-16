import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/components/ui'
import { barcodeRoutes } from '@/features/barcode/routes'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { MapScreenState } from '../components/MapEmptyState'

export default function MapScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <ScreenContainer
      header={<TabTopBar routeName="map" />}
      scrollable
      contentProps={{ flex: 1, gap: '$4', px: '$4', pt: '$2', pb: '$8' }}
      decorativeBackground={false}
      testID="map-screen"
    >
      <MapScreenState
        actionHint={t('tabScreens.map.comingSoon.actionHint')}
        description={t('tabScreens.map.comingSoon.description')}
        errorDescription={t('tabScreens.map.errors.description')}
        errorRecoveryHint={t('tabScreens.map.errors.recoveryHint')}
        errorTitle={t('tabScreens.map.errors.title')}
        fallbackActionLabel={t('tabScreens.map.fallback.actionLabel')}
        fallbackActionTitle={t('tabScreens.map.fallback.title')}
        fallbackDescription={t('tabScreens.map.fallback.description')}
        fallbackStatusLabel={t('tabScreens.map.fallback.statusLabel')}
        onActionPress={() => router.push(barcodeRoutes.index)}
        statusLabel={t('tabScreens.map.comingSoon.statusLabel')}
        title={t('tabScreens.map.comingSoon.title')}
      />
    </ScreenContainer>
  )
}
