import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { QueryErrorState, ScreenContainer } from '@/components/ui'
import { barcodeRoutes } from '@/features/barcode/routes'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { MapEmptyState, MapScreenSkeleton } from '../components/MapEmptyState'
import { useMapScreenQuery } from '../hooks'

export default function MapScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { data, isError, isPending, isRefetching, refetch } =
    useMapScreenQuery()

  const handleRefresh = () => {
    void refetch()
  }

  return (
    <ScreenContainer
      header={<TabTopBar routeName="map" />}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      scrollable
      contentProps={{ flex: 1, gap: 0, px: 0, pt: 0, pb: 0 }}
      testID="map-screen"
    >
      {isError && !data ? (
        <QueryErrorState
          description={t('tabScreens.map.errors.description')}
          onRetry={handleRefresh}
          recoveryHint={t('tabScreens.map.errors.recoveryHint')}
          testID="map-screen-error-state"
          title={t('tabScreens.map.errors.title')}
        />
      ) : !data || isPending ? (
        <MapScreenSkeleton />
      ) : (
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
      )}
    </ScreenContainer>
  )
}
