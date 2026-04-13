import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScreenContainer } from '@/components/ui'
import { barcodeRoutes } from '@/features/barcode/routes'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { MapEmptyState } from '../components/MapEmptyState'

export default function MapScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <ScreenContainer
      header={<TabTopBar routeName="map" />}
      scrollable
      contentProps={{ flex: 1, gap: 0, px: 0, pt: 0, pb: 0 }}
      testID="map-screen"
    >
      <MapEmptyState
        actionHint={t('tabScreens.map.comingSoon.actionHint')}
        description={t('tabScreens.map.comingSoon.description')}
        fallbackActionLabel={t('tabScreens.map.fallback.actionLabel')}
        fallbackActionTitle={t('tabScreens.map.fallback.title')}
        fallbackDescription={t('tabScreens.map.fallback.description')}
        onActionPress={() => router.push(barcodeRoutes.index)}
        statusLabel={t('tabScreens.map.comingSoon.statusLabel')}
        title={t('tabScreens.map.comingSoon.title')}
      />
    </ScreenContainer>
  )
}
